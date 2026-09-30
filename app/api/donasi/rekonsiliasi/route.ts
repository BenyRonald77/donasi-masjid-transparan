import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hitungUlangTerkumpul } from "@/lib/donasi";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const total = Number(body?.total_transfer_rp ?? body?.totalTransferRp);
  const kampanyeId = Number(body?.kampanye_id ?? body?.kampanyeId);

  if (!Number.isInteger(total) || total <= 0)
    return NextResponse.json(
      { error: "total_transfer_rp harus bilangan bulat lebih dari 0" },
      { status: 400 }
    );
  if (!Number.isInteger(kampanyeId))
    return NextResponse.json({ error: "kampanye_id tidak valid" }, { status: 400 });

  const cocok = await prisma.donasi.findFirst({
    where: { kampanyeId, status: "pending", totalTransferRp: total },
    orderBy: { id: "asc" },
  });
  if (!cocok)
    return NextResponse.json(
      { error: "tidak ada donasi pending dengan total transfer tersebut" },
      { status: 404 }
    );

  const updated = await prisma.donasi.update({
    where: { id: cocok.id },
    data: { status: "terkonfirmasi" },
  });
  await hitungUlangTerkumpul(kampanyeId);
  return NextResponse.json({
    ok: true,
    donasi: updated,
    pesan: `Donasi dari ${updated.donaturNama} terkonfirmasi`,
  });
}
