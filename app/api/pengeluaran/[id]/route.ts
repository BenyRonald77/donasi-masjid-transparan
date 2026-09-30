import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const p = await prisma.pengeluaran.findUnique({ where: { id } });
  if (!p)
    return NextResponse.json({ error: "pengeluaran tidak ditemukan" }, { status: 404 });

  if (p.buktiUrl) {
    try {
      await fs.unlink(path.join(process.cwd(), "public", p.buktiUrl));
    } catch {
      // file sudah tidak ada, abaikan
    }
  }
  await prisma.pengeluaran.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
