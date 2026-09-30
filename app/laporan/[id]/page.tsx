import Link from "next/link";
import { notFound } from "next/navigation";
import { susunLaporan } from "@/lib/laporan";
import { rupiah, persen, formatTanggal } from "@/lib/format";

const isGambar = (url: string) => /\.(jpg|jpeg|png|webp)$/i.test(url);

export default async function LaporanPublik({
  params,
}: {
  params: { id: string };
}) {
  const laporan = await susunLaporan(Number(params.id));
  if (!laporan) notFound();

  const { kampanye, donasi, pengeluaran } = laporan;
  const p = persen(laporan.total_masuk_rp, kampanye.target_rp);

  return (
    <div className="space-y-6">
      <div className="rounded bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Laporan Publik Transparan
        </p>
        <h1 className="mt-1 text-2xl font-bold">{kampanye.nama}</h1>
        <p className="mt-1 text-sm text-slate-500">{kampanye.deskripsi}</p>
        {laporan.terkunci && (
          <div className="mt-3 rounded border border-slate-300 bg-slate-100 p-3">
            <p className="font-bold text-slate-700">🔒 PERIODE TERKUNCI</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-600">
              SHA-256: {laporan.penutupan?.hash_laporan}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ditutup pada: {laporan.penutupan?.ditutup_pada}
            </p>
          </div>
        )}
      </div>

      <div className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Progres Penggalangan</h2>
        <div className="h-4 overflow-hidden rounded bg-slate-200">
          <div className="h-full bg-emerald-500" style={{ width: `${p}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="font-semibold text-emerald-700">{rupiah(laporan.total_masuk_rp)}</span>
          <span className="text-slate-500">dari {rupiah(kampanye.target_rp)} ({p}%)</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded bg-emerald-50 p-3">
            <p className="text-xs text-slate-500">Total Masuk</p>
            <p className="font-bold text-emerald-700">{rupiah(laporan.total_masuk_rp)}</p>
          </div>
          <div className="rounded bg-red-50 p-3">
            <p className="text-xs text-slate-500">Total Keluar</p>
            <p className="font-bold text-red-700">{rupiah(laporan.total_keluar_rp)}</p>
          </div>
          <div className="rounded bg-blue-50 p-3">
            <p className="text-xs text-slate-500">Saldo</p>
            <p className="font-bold text-blue-700">{rupiah(laporan.saldo_rp)}</p>
          </div>
        </div>
      </div>

      <div className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Donasi Terkonfirmasi ({donasi.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 pr-2">Donatur</th>
                <th className="py-2 pr-2">Nominal</th>
                <th className="py-2">Metode</th>
              </tr>
            </thead>
            <tbody>
              {donasi.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">{d.donatur}</td>
                  <td className="py-2 pr-2">{rupiah(d.nominal_rp)}</td>
                  <td className="py-2">{d.metode}</td>
                </tr>
              ))}
              {donasi.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-slate-400">Belum ada donasi terkonfirmasi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Nama donatur disamarkan demi privasi.
        </p>
      </div>

      <div className="rounded bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Pengeluaran ({pengeluaran.length})</h2>
        <div className="space-y-3">
          {pengeluaran.map((x) => (
            <div key={x.id} className="flex flex-wrap items-start justify-between gap-3 rounded border p-3">
              <div>
                <p className="font-medium">{x.keterangan}</p>
                <p className="text-sm text-slate-500">
                  {rupiah(x.nominal_rp)} · {formatTanggal(x.tanggal)} · Penerima: {x.penerima}
                </p>
                {x.bukti_url && (
                  <div className="mt-2">
                    {isGambar(x.bukti_url) ? (
                      <a href={x.bukti_url} target="_blank" rel="noreferrer">
                        <img src={x.bukti_url} alt="Bukti pengeluaran"
                          className="h-24 rounded border object-cover" />
                      </a>
                    ) : (
                      <a href={x.bukti_url} target="_blank" rel="noreferrer"
                        className="text-sm text-blue-700 hover:underline">
                        📄 Lihat bukti
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {pengeluaran.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Belum ada pengeluaran.</p>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Data JSON tersedia di <Link href={`/api/kampanye/${kampanye.id}/laporan`} className="text-blue-700 hover:underline">/api/kampanye/{kampanye.id}/laporan</Link>
      </p>
    </div>
  );
}
