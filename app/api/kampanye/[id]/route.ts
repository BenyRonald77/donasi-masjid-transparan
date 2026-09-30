import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TGL = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const k = await prisma.kampanye.findUnique({
    where: { id },
    include: {
      donasi: { orderBy: { id: "desc" } },
      pengeluaran: { orderBy: { id: "desc" } },
      penutupan: true,
    },
  });
  if (!k)
    return NextResponse.json({ error: "kampanye tidak ditemukan" }, { status: 404 });
  return NextResponse.json(k);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const k = await prisma.kampanye.findUnique({ where: { id } });
  if (!k)
    return NextResponse.json({ error: "kampanye tidak ditemukan" }, { status: 404 });
  if (k.status === "ditutup")
    return NextResponse.json(
      { error: "kampanye sudah ditutup dan terkunci" },
      { status: 409 }
    );

  const body = await req.json().catch(() => null);
  const data: { nama?: string; deskripsi?: string; targetRp?: number; tenggat?: string } = {};
  if (body?.nama !== undefined) {
    const nama = String(body.nama).trim();
    if (!nama)
      return NextResponse.json({ error: "nama tidak boleh kosong" }, { status: 400 });
    data.nama = nama;
  }
  if (body?.deskripsi !== undefined) data.deskripsi = String(body.deskripsi).trim();
  if (body?.target_rp !== undefined || body?.targetRp !== undefined) {
    const targetRp = Number(body?.target_rp ?? body?.targetRp);
    if (!Number.isInteger(targetRp) || targetRp <= 0)
      return NextResponse.json(
        { error: "target_rp harus bilangan bulat lebih dari 0" },
        { status: 400 }
      );
    data.targetRp = targetRp;
  }
  if (body?.tenggat !== undefined) {
    const tenggat = String(body.tenggat).trim();
    if (!TGL.test(tenggat))
      return NextResponse.json(
        { error: "tenggat harus berformat YYYY-MM-DD" },
        { status: 400 }
      );
    data.tenggat = tenggat;
  }

  const updated = await prisma.kampanye.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const k = await prisma.kampanye.findUnique({ where: { id } });
  if (!k)
    return NextResponse.json({ error: "kampanye tidak ditemukan" }, { status: 404 });
  const [jmlDonasi, jmlPengeluaran, penutupan] = await Promise.all([
    prisma.donasi.count({ where: { kampanyeId: id } }),
    prisma.pengeluaran.count({ where: { kampanyeId: id } }),
    prisma.penutupanPeriode.findUnique({ where: { kampanyeId: id } }),
  ]);
  if (jmlDonasi > 0 || jmlPengeluaran > 0 || penutupan)
    return NextResponse.json(
      { error: "kampanye tidak dapat dihapus karena masih memiliki data donasi/pengeluaran/penutupan" },
      { status: 409 }
    );
  await prisma.kampanye.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
