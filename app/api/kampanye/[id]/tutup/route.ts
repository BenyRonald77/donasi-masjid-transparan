import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { nowISO } from "@/lib/format";
import { LaporanRingkasan } from "@/lib/laporan";

export async function POST(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });

  const k = await prisma.kampanye.findUnique({
    where: { id },
    include: { donasi: true, pengeluaran: true, penutupan: true },
  });
  if (!k)
    return NextResponse.json({ error: "kampanye tidak ditemukan" }, { status: 404 });
  if (k.status === "ditutup" || k.penutupan)
    return NextResponse.json(
      { error: "kampanye sudah ditutup sebelumnya" },
      { status: 409 }
    );

  const donasiOk = k.donasi.filter((d) => d.status === "terkonfirmasi");
  const totalDonasi = donasiOk.reduce((s, d) => s + d.nominalRp, 0);
  const totalPengeluaran = k.pengeluaran.reduce((s, p) => s + p.nominalRp, 0);
  const ditutupPada = nowISO();

  const ringkasan: LaporanRingkasan = {
    kampanye_id: k.id,
    nama: k.nama,
    target_rp: k.targetRp,
    total_donasi_terkonfirmasi_rp: totalDonasi,
    total_pengeluaran_rp: totalPengeluaran,
    saldo_rp: totalDonasi - totalPengeluaran,
    jumlah_donasi_terkonfirmasi: donasiOk.length,
    jumlah_pengeluaran: k.pengeluaran.length,
    ditutup_pada: ditutupPada,
  };
  const hash = createHash("sha256")
    .update(JSON.stringify(ringkasan))
    .digest("hex");

  const penutupan = await prisma.penutupanPeriode.create({
    data: {
      kampanyeId: k.id,
      ditutupPada,
      hashLaporan: hash,
      ringkasan: JSON.stringify(ringkasan),
    },
  });
  await prisma.kampanye.update({ where: { id }, data: { status: "ditutup" } });

  return NextResponse.json(penutupan, { status: 201 });
}
