import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hitungUlangTerkumpul } from "@/lib/donasi";

const STATUS = ["pending", "terkonfirmasi", "batal"];

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const status = String(body?.status ?? "").trim();
  if (!STATUS.includes(status))
    return NextResponse.json(
      { error: `status harus salah satu dari: ${STATUS.join(", ")}` },
      { status: 400 }
    );

  const d = await prisma.donasi.findUnique({ where: { id } });
  if (!d)
    return NextResponse.json({ error: "donasi tidak ditemukan" }, { status: 404 });

  const wasConfirmed = d.status === "terkonfirmasi";
  const willConfirm = status === "terkonfirmasi";
  const updated = await prisma.donasi.update({ where: { id }, data: { status } });
  if (wasConfirmed !== willConfirm) {
    await hitungUlangTerkumpul(d.kampanyeId);
  }
  return NextResponse.json(updated);
}
