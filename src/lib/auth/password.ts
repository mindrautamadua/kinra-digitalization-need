import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function passwordPolicyError(p: string): string | null {
  if (p.length < 8) return "Kata sandi minimal 8 karakter.";
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return "Kata sandi harus memuat huruf dan angka.";
  return null;
}
