import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Donasi Masjid Transparan",
  description: "Donasi masjid/panti dengan kode unik pembayaran dan laporan transparan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <header className="bg-emerald-700 text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <a href="/" className="text-lg font-bold">
              🕌 Donasi Masjid Transparan
            </a>
            <span className="text-sm text-emerald-100">Amanah &amp; Terbuka</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-slate-400">
          Setiap rupiah tercatat dan dapat dipertanggungjawabkan.
        </footer>
      </body>
    </html>
  );
}
