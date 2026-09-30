import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nowISO } from "@/lib/format";

const TGL = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const rows = await prisma.kampanye.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const nama = String(body?.nama ?? "").trim();
  const deskripsi = String(body?.deskripsi ?? "").trim();
  const targetRp = Number(body?.target_rp ?? body?.targetRp);
  const tenggat = String(body?.tenggat ?? "").trim();

  if (!nama)
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  if (!Number.isInteger(targetRp) || targetRp <= 0)
    return NextResponse.json(
      { error: "target_rp harus bilangan bulat lebih dari 0" },
      { status: 400 }
    );
  if (!TGL.test(tenggat))
    return NextResponse.json(
      { error: "tenggat harus berformat YYYY-MM-DD" },
      { status: 400 }
    );

  const created = await prisma.kampanye.create({
    data: {
      nama,
      deskripsi,
      targetRp,
      terkumpulRp: 0,
      tenggat,
      status: "aktif",
      createdAt: nowISO(),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
