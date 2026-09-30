"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { rupiah } from "@/lib/format";

interface Donasi {
  id: number;
  donaturNama: string;
  nominalRp: number;
  kodeUnik: number;
  totalTransferRp: number;
  status: string;
  metode: string;
}

export default function DonasiPanel({
  kampanyeId,
  donasi,
  terkunci,
}: {
  kampanyeId: number;
  donasi: Donasi[];
  terkunci: boolean;
}) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [nominal, setNominal] = useState("");
  const [metode, setMetode] = useState("transfer");
  const [totalCocok, setTotalCocok] = useState("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setPesan("");
    const res = await fetch("/api/donasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kampanye_id: kampanyeId,
        donatur_nama: nama,
        nominal_rp: Number(nominal),
        metode,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Gagal mencatat donasi");
      return;
    }
    setPesan(
      `Donasi tercatat. Minta donatur transfer ${rupiah(data.total_transfer_rp)} (kode unik ${data.kode_unik})`
    );
    setNama(""); setNominal("");
    router.refresh();
  }

  async function rekonsiliasi(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setPesan("");
    const res = await fetch("/api/donasi/rekonsiliasi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kampanye_id: kampanyeId,
        total_transfer_rp: Number(totalCocok),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Rekonsiliasi gagal");
      return;
    }
    setPesan(data.pesan ?? "Donasi terkonfirmasi");
    setTotalCocok("");
    router.refresh();
  }

  async function ubahStatus(id: number, status: string) {
    if (!confirm(`Ubah status donasi menjadi "${status}"?`)) return;
    const res = await fetch(`/api/donasi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Gagal mengubah status");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {pesan && <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-700">{pesan}</p>}
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>}

      {!terkunci && (
        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={tambah} className="rounded border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold">Catat Donasi Baru</h3>
            <div className="space-y-2">
              <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama donatur"
                className="w-full rounded border px-3 py-2 text-sm" required />
              <input value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="Nominal (Rp)"
                type="number" min="1" className="w-full rounded border px-3 py-2 text-sm" required />
              <select value={metode} onChange={(e) => setMetode(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm">
                <option value="transfer">Transfer bank</option>
                <option value="qris">QRIS</option>
                <option value="ewallet">E-wallet</option>
                <option value="tunai">Tunai</option>
              </select>
              <button className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
                Simpan &amp; Buat Kode Unik
              </button>
            </div>
          </form>

          <form onSubmit={rekonsiliasi} className="rounded border bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-semibold">Rekonsiliasi Otomatis</h3>
            <p className="mb-2 text-xs text-slate-500">
              Masukkan total transfer yang masuk — sistem mencocokkan dengan donasi pending.
            </p>
            <div className="flex gap-2">
              <input value={totalCocok} onChange={(e) => setTotalCocok(e.target.value)}
                placeholder="Total transfer (Rp)" type="number" min="1"
                className="w-full rounded border px-3 py-2 text-sm" required />
              <button className="shrink-0 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                Cocokkan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded border bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-semibold">Daftar Donasi ({donasi.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-2">Donatur</th>
                <th className="py-2 pr-2">Nominal</th>
                <th className="py-2 pr-2">Kode Unik</th>
                <th className="py-2 pr-2">Total Transfer</th>
                <th className="py-2 pr-2">Metode</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {donasi.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">{d.donaturNama}</td>
                  <td className="py-2 pr-2">{rupiah(d.nominalRp)}</td>
                  <td className="py-2 pr-2 font-mono">{d.kodeUnik}</td>
                  <td className="py-2 pr-2 font-mono">{rupiah(d.totalTransferRp)}</td>
                  <td className="py-2 pr-2">{d.metode}</td>
                  <td className="py-2 pr-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      d.status === "terkonfirmasi" ? "bg-emerald-100 text-emerald-800"
                      : d.status === "batal" ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                    }`}>{d.status}</span>
                  </td>
                  <td className="py-2">
                    {d.status === "pending" && (
                      <span className="flex gap-2 text-xs">
                        <button onClick={() => ubahStatus(d.id, "terkonfirmasi")}
                          className="text-emerald-700 hover:underline">Konfirmasi</button>
                        <button onClick={() => ubahStatus(d.id, "batal")}
                          className="text-red-600 hover:underline">Batalkan</button>
                      </span>
                    )}
                    {d.status === "terkonfirmasi" && !terkunci && (
                      <button onClick={() => ubahStatus(d.id, "batal")}
                        className="text-xs text-red-600 hover:underline">Batalkan</button>
                    )}
                  </td>
                </tr>
              ))}
              {donasi.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-slate-400">Belum ada donasi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
