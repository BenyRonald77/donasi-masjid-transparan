import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowISO } from "@/lib/format";
import { buatKodeUnik } from "@/lib/donasi";

const METODE = ["transfer", "tunai", "qris", "ewallet"];

export async function GET(req: NextRequest) {
  const kampanyeId = req.nextUrl.searchParams.get("kampanye_id");
  const where = kampanyeId ? { kampanyeId: Number(kampanyeId) } : {};
  const rows = await prisma.donasi.findMany({
    where,
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const kampanyeId = Number(body?.kampanye_id ?? body?.kampanyeId);
  const donaturNama = String(body?.donatur_nama ?? body?.donaturNama ?? "").trim();
  const nominalRp = Number(body?.nominal_rp ?? body?.nominalRp);
  const metode = String(body?.metode ?? "transfer").trim().toLowerCase();

  if (!Number.isInteger(kampanyeId))
    return NextResponse.json({ error: "kampanye_id tidak valid" }, { status: 400 });
  if (!donaturNama)
    return NextResponse.json({ error: "donatur_nama wajib diisi" }, { status: 400 });
  if (!Number.isInteger(nominalRp) || nominalRp <= 0)
    return NextResponse.json(
      { error: "nominal_rp harus bilangan bulat lebih dari 0" },
      { status: 400 }
    );
  if (!METODE.includes(metode))
    return NextResponse.json(
      { error: `metode harus salah satu dari: ${METODE.join(", ")}` },
      { status: 400 }
    );

  const k = await prisma.kampanye.findUnique({ where: { id: kampanyeId } });
  if (!k)
    return NextResponse.json({ error: "kampanye tidak ditemukan" }, { status: 404 });
  if (k.status === "ditutup")
    return NextResponse.json(
      { error: "kampanye sudah ditutup, donasi baru tidak diterima" },
      { status: 409 }
    );

  const kodeUnik = await buatKodeUnik(kampanyeId);
  const created = await prisma.donasi.create({
    data: {
      kampanyeId,
      donaturNama,
      nominalRp,
      kodeUnik,
      totalTransferRp: nominalRp + kodeUnik,
      status: "pending",
      metode,
      createdAt: nowISO(),
    },
  });
  return NextResponse.json(
    {
      ...created,
      kode_unik: created.kodeUnik,
      total_transfer_rp: created.totalTransferRp,
    },
    { status: 201 }
  );
}
