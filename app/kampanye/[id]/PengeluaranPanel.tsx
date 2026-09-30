"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { rupiah, formatTanggal, today } from "@/lib/format";

interface Pengeluaran {
  id: number;
  keterangan: string;
  nominalRp: number;
  tanggal: string;
  penerima: string;
  buktiUrl: string | null;
}

const isGambar = (url: string) => /\.(jpg|jpeg|png|webp)$/i.test(url);

export default function PengeluaranPanel({
  kampanyeId,
  pengeluaran,
  terkunci,
}: {
  kampanyeId: number;
  pengeluaran: Pengeluaran[];
  terkunci: boolean;
}) {
  const router = useRouter();
  const [keterangan, setKeterangan] = useState("");
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(today());
  const [penerima, setPenerima] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setPesan(""); setLoading(true);
    try {
      const form = new FormData();
      form.append("kampanye_id", String(kampanyeId));
      form.append("keterangan", keterangan);
      form.append("nominal_rp", nominal);
      form.append("tanggal", tanggal);
      form.append("penerima", penerima);
      if (file) form.append("bukti", file);
      const res = await fetch("/api/pengeluaran", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal mencatat pengeluaran");
        return;
      }
      setPesan("Pengeluaran tercatat.");
      setKeterangan(""); setNominal(""); setPenerima(""); setFile(null);
      const buktiInput = document.getElementById("bukti-input") as HTMLInputElement | null;
      if (buktiInput) buktiInput.value = "";
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function hapus(id: number) {
    if (!confirm("Hapus pengeluaran ini beserta bukti uploadnya?")) return;
    const res = await fetch(`/api/pengeluaran/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Gagal menghapus");
      return;
    }
    router.refresh();
  }

  const total = pengeluaran.reduce((s, p) => s + p.nominalRp, 0);

  return (
    <div className="space-y-4">
      {pesan && <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-700">{pesan}</p>}
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      {!terkunci && (
        <form onSubmit={simpan} className="rounded border bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-semibold">Catat Pengeluaran</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm">Keterangan</span>
              <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm">Nominal (Rp)</span>
              <input value={nominal} onChange={(e) => setNominal(e.target.value)}
                type="number" min="1" className="mt-1 w-full rounded border px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm">Tanggal</span>
              <input value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                type="date" className="mt-1 w-full rounded border px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm">Penerima</span>
              <input value={penerima} onChange={(e) => setPenerima(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm" required />
            </label>
            <label className="block">
              <span className="text-sm">Bukti (jpg/png/webp/pdf, maks 5 MB)</span>
              <input id="bukti-input" type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm" />
            </label>
          </div>
          <button disabled={loading}
            className="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Mengunggah..." : "Simpan Pengeluaran"}
          </button>
        </form>
      )}

      <div className="rounded border bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-semibold">
          Daftar Pengeluaran ({pengeluaran.length}) · Total {rupiah(total)}
        </h3>
        <div className="space-y-3">
          {pengeluaran.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start justify-between gap-3 rounded border p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.keterangan}</p>
                <p className="text-sm text-slate-500">
                  {rupiah(p.nominalRp)} · {formatTanggal(p.tanggal)} · Penerima: {p.penerima}
                </p>
                {p.buktiUrl && (
                  <div className="mt-2">
                    {isGambar(p.buktiUrl) ? (
                      <a href={p.buktiUrl} target="_blank" rel="noreferrer">
                        <img src={p.buktiUrl} alt="Bukti pengeluaran"
                          className="h-24 rounded border object-cover" />
                      </a>
                    ) : (
                      <a href={p.buktiUrl} target="_blank" rel="noreferrer"
                        className="text-sm text-blue-700 hover:underline">
                        📄 Lihat bukti
                      </a>
                    )}
                  </div>
                )}
              </div>
              {!terkunci && (
                <button onClick={() => hapus(p.id)}
                  className="text-sm text-red-600 hover:underline">Hapus</button>
              )}
            </div>
          ))}
          {pengeluaran.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Belum ada pengeluaran.</p>
          )}
        </div>
      </div>
    </div>
  );
}
