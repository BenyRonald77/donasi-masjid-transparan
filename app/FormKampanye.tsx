"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { today } from "@/lib/format";

export default function FormKampanye() {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [target, setTarget] = useState("");
  const [tenggat, setTenggat] = useState(today());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/kampanye", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          deskripsi,
          target_rp: Number(target),
          tenggat,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan kampanye");
        return;
      }
      setNama(""); setDeskripsi(""); setTarget(""); setBuka(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!buka)
    return (
      <button
        onClick={() => setBuka(true)}
        className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
      >
        + Buat Kampanye Baru
      </button>
    );

  return (
    <form onSubmit={simpan} className="rounded border bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Kampanye Baru</h2>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm">Nama kampanye</span>
          <input value={nama} onChange={(e) => setNama(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Target (Rp)</span>
          <input value={target} onChange={(e) => setTarget(e.target.value)}
            type="number" min="1" className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="block">
          <span className="text-sm">Tenggat</span>
          <input value={tenggat} onChange={(e) => setTenggat(e.target.value)}
            type="date" className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm">Deskripsi</span>
          <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2" rows={3} />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button disabled={loading} className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50">
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        <button type="button" onClick={() => setBuka(false)}
          className="rounded border px-4 py-2">Batal</button>
      </div>
    </form>
  );
}
