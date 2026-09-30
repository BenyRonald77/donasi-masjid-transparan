"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UbahKampanye({
  id,
  awal,
}: {
  id: number;
  awal: { nama: string; deskripsi: string; targetRp: number; tenggat: string };
}) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState(awal.nama);
  const [deskripsi, setDeskripsi] = useState(awal.deskripsi);
  const [target, setTarget] = useState(String(awal.targetRp));
  const [tenggat, setTenggat] = useState(awal.tenggat);
  const [error, setError] = useState("");

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/kampanye/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama,
        deskripsi,
        target_rp: Number(target),
        tenggat,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan perubahan");
      return;
    }
    setBuka(false);
    router.refresh();
  }

  if (!buka)
    return (
      <button onClick={() => setBuka(true)}
        className="rounded border px-3 py-1 text-sm hover:bg-slate-100">
        Ubah Kampanye
      </button>
    );

  return (
    <form onSubmit={simpan} className="rounded border bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold">Ubah Kampanye</h3>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm">Nama</span>
          <input value={nama} onChange={(e) => setNama(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm">Target (Rp)</span>
          <input value={target} onChange={(e) => setTarget(e.target.value)}
            type="number" min="1" className="mt-1 w-full rounded border px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm">Tenggat</span>
          <input value={tenggat} onChange={(e) => setTenggat(e.target.value)}
            type="date" className="mt-1 w-full rounded border px-3 py-2 text-sm" required />
        </label>
        <label className="block">
          <span className="text-sm">Deskripsi</span>
          <input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
          Simpan
        </button>
        <button type="button" onClick={() => setBuka(false)}
          className="rounded border px-4 py-2 text-sm">Batal</button>
      </div>
    </form>
  );
}
