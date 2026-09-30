import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { rupiah, persen, formatTanggal } from "@/lib/format";
import DonasiPanel from "./DonasiPanel";
import PengeluaranPanel from "./PengeluaranPanel";
import TutupPanel from "./TutupPanel";
import UbahKampanye from "./UbahKampanye";

export default async function DetailKampanye({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const k = await prisma.kampanye.findUnique({
    where: { id },
    include: {
      donasi: { orderBy: { id: "desc" } },
      pengeluaran: { orderBy: { id: "desc" } },
      penutupan: true,
    },
  });
  if (!k) notFound();

  const terkunci = k.status === "ditutup";
  const p = persen(k.terkumpulRp, k.targetRp);
  const totalKeluar = k.pengeluaran.reduce((s, x) => s + x.nominalRp, 0);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Kembali ke dashboard
      </Link>

      <div className="rounded bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{k.nama}</h1>
            <p className="mt-1 text-sm text-slate-500">{k.deskripsi}</p>
          </div>
          <span
            className={`rounded px-2 py-1 text-xs font-bold ${
              terkunci ? "bg-slate-700 text-white" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {terkunci ? "TERKUNCI" : "AKTIF"}
          </span>
        </div>
        <div className="mt-4">
          <div className="h-4 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-emerald-500" style={{ width: `${p}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="font-semibold text-emerald-700">{rupiah(k.terkumpulRp)}</span>
            <span className="text-slate-500">dari {rupiah(k.targetRp)} ({p}%)</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>Tenggat: {formatTanggal(k.tenggat)}</span>
          <span>Total pengeluaran: {rupiah(totalKeluar)}</span>
          <span>Saldo: <b className="text-slate-700">{rupiah(k.terkumpulRp - totalKeluar)}</b></span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {!terkunci && (
            <UbahKampanye
              id={k.id}
              awal={{ nama: k.nama, deskripsi: k.deskripsi, targetRp: k.targetRp, tenggat: k.tenggat }}
            />
          )}
          <Link href={`/laporan/${k.id}`}
            className="rounded border px-3 py-1 text-sm text-blue-700 hover:bg-blue-50">
            Lihat Laporan Publik
          </Link>
        </div>
      </div>

      <TutupPanel
        kampanyeId={k.id}
        terkunci={terkunci}
        hash={k.penutupan?.hashLaporan ?? null}
        ditutupPada={k.penutupan?.ditutupPada ?? null}
      />

      <section>
        <h2 className="mb-2 text-lg font-bold">Donasi</h2>
        <DonasiPanel kampanyeId={k.id} donasi={k.donasi} terkunci={terkunci} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Pengeluaran</h2>
        <PengeluaranPanel kampanyeId={k.id} pengeluaran={k.pengeluaran} terkunci={terkunci} />
      </section>
    </div>
  );
}
