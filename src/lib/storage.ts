import "server-only";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ALLOWED_MIME, maxUploadBytes } from "./upload-rules";
export { ALLOWED_MIME, maxUploadBytes, validateUpload } from "./upload-rules";

/**
 * Penyimpanan lampiran privat.
 * - Supabase Storage bila SUPABASE_SERVICE_ROLE_KEY + URL proyek tersedia (wajib untuk deploy serverless).
 * - Fallback ke folder lokal STORAGE_DIR (dev/test tanpa Supabase).
 * Bucket selalu privat; unduhan tetap lewat /api/attachments/[id] yang memeriksa hak akses.
 */

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "attachments";

let supabase: SupabaseClient | null | undefined;
function supabaseAdmin() {
  if (supabase !== undefined) return supabase;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  supabase = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return supabase;
}

let bucketReady: Promise<void> | null = null;
function ensureBucket(client: SupabaseClient) {
  bucketReady ??= (async () => {
    const { error } = await client.storage.getBucket(BUCKET);
    if (!error) return;
    const { error: createError } = await client.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: maxUploadBytes(),
      allowedMimeTypes: Object.keys(ALLOWED_MIME),
    });
    if (createError && !/already exists/i.test(createError.message)) throw createError;
  })().catch((err) => {
    bucketReady = null;
    throw err;
  });
  return bucketReady;
}

function storageRoot() {
  const dir = process.env.STORAGE_DIR ?? "./storage";
  return path.isAbsolute(dir) ? dir : path.join(/*turbopackIgnore: true*/ process.cwd(), dir);
}

function isSafeKey(key: string) {
  return key.length > 0 && !key.startsWith("/") && !key.split("/").includes("..");
}

export async function saveFile(needId: string, buf: Buffer, originalName: string, contentType?: string) {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const key = path.posix.join(needId, `${randomUUID()}${ext}`);
  const client = supabaseAdmin();
  if (client) {
    await ensureBucket(client);
    const { error } = await client.storage.from(BUCKET).upload(key, buf, { contentType, upsert: false });
    if (error) throw error;
    return key;
  }
  const abs = path.join(storageRoot(), key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, buf, { flag: "wx" });
  return key;
}

export async function readStoredFile(key: string) {
  if (!isSafeKey(key)) throw new Error("Path tidak valid.");
  const client = supabaseAdmin();
  if (client) {
    const { data, error } = await client.storage.from(BUCKET).download(key);
    if (error) throw error;
    return Buffer.from(await data.arrayBuffer());
  }
  const root = storageRoot();
  const abs = path.resolve(root, key);
  if (!abs.startsWith(path.resolve(root) + path.sep)) throw new Error("Path tidak valid.");
  return readFile(abs);
}

export async function deleteStoredFile(key: string) {
  if (!isSafeKey(key)) return;
  const client = supabaseAdmin();
  if (client) {
    await client.storage.from(BUCKET).remove([key]);
    return;
  }
  const root = storageRoot();
  const abs = path.resolve(root, key);
  if (!abs.startsWith(path.resolve(root) + path.sep)) return;
  await unlink(abs).catch(() => undefined);
}
