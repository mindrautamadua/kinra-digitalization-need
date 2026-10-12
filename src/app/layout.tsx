import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KINRA Digitalization Needs Assessment", template: "%s · KINRA DNA" },
  description: "Aplikasi internal pengumpulan dan prioritisasi kebutuhan digitalisasi PT Kawasan Industri Nusantara.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
