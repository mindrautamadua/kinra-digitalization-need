import path from "node:path";

export const ALLOWED_MIME: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/csv": [".csv"],
  "text/plain": [".txt"],
};

export function maxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? 10);
  return (Number.isFinite(mb) && mb > 0 ? mb : 10) * 1024 * 1024;
}


/** Validasi ekstensi + MIME + magic bytes sederhana. Mengembalikan pesan error atau null. */
export function validateUpload(file: { name: string; type: string; size: number }, head: Uint8Array): string | null {
  if (file.size <= 0) return "File kosong.";
  if (file.size > maxUploadBytes()) return `Ukuran file melebihi ${Math.round(maxUploadBytes() / 1024 / 1024)} MB.`;
  const ext = path.extname(file.name).toLowerCase();
  const allowedExts = ALLOWED_MIME[file.type];
  if (!allowedExts) return "Tipe file tidak diizinkan. Gunakan PDF, PNG, JPG, XLSX, DOCX, PPTX, CSV, atau TXT.";
  if (!allowedExts.includes(ext)) return "Ekstensi file tidak sesuai dengan tipe file.";
  // magic bytes
  const hex = Array.from(head.slice(0, 4)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (file.type === "application/pdf" && !hex.startsWith("25504446")) return "File PDF tidak valid.";
  if (file.type === "image/png" && !hex.startsWith("89504e47")) return "File PNG tidak valid.";
  if (file.type === "image/jpeg" && !hex.startsWith("ffd8")) return "File JPG tidak valid.";
  if (file.type.startsWith("application/vnd.openxmlformats") && !hex.startsWith("504b0304")) return "File Office tidak valid.";
  return null;
}

