import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { rupiah, persen, formatTanggal } from "@/lib/format";
import FormKampanye from "./FormKampanye";
import HapusKampanye from "./HapusKampanye";

export default async function Home() {
  const daftar = await prisma.kampanye.findMany({ orderBy: { id: "desc" } });
  const totalTerkumpul = daftar.reduce((s, k) => s + k.terkumpulRp, 0);

  return (
    <div className="space-y-6">
      <div className="rounded bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Dashboard Donasi</h1>
        <p className="mt-1 text-sm text-slate-500">
          {daftar.length} kampanye · total terkumpul{" "}
          <span className="font-semibold text-emerald-700">{rupiah(totalTerkumpul)}</span>
        </p>
      </div>

      <FormKampanye />

      <div className="grid gap-4 md:grid-cols-2">
        {daftar.map((k) => {
          const p = persen(k.terkumpulRp, k.targetRp);
          const terkunci = k.status === "ditutup";
          return (
            <div key={k.id} className="rounded border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{k.nama}</h2>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${
                    terkunci ? "bg-slate-700 text-white" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {terkunci ? "TERKUNCI" : "AKTIF"}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{k.deskripsi}</p>
              <div className="mt-3">
                <div className="h-3 overflow-hidden rounded bg-slate-200">
                  <div className="h-full bg-emerald-500" style={{ width: `${p}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span className="font-semibold text-emerald-700">{rupiah(k.terkumpulRp)}</span>
                  <span className="text-slate-500">dari {rupiah(k.targetRp)} ({p}%)</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">Tenggat: {formatTanggal(k.tenggat)}</p>
              <div className="mt-3 flex gap-3 text-sm">
                <Link href={`/kampanye/${k.id}`} className="text-emerald-700 hover:underline">
                  Kelola →
                </Link>
                <Link href={`/laporan/${k.id}`} className="text-blue-700 hover:underline">
                  Laporan Publik →
                </Link>
                {!terkunci && <HapusKampanye id={k.id} nama={k.nama} />}
              </div>
            </div>
          );
        })}
      </div>

      {daftar.length === 0 && (
        <p className="rounded bg-white p-6 text-center text-slate-500 shadow-sm">
          Belum ada kampanye. Buat kampanye pertama di atas.
        </p>
      )}
    </div>
  );
}
