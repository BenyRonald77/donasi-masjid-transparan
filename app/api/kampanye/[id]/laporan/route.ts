import { NextRequest, NextResponse } from "next/server";
import { susunLaporan } from "@/lib/laporan";

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  const laporan = await susunLaporan(id);
  if (!laporan)
    return NextResponse.json({ error: "kampanye tidak ditemukan" }, { status: 404 });
  return NextResponse.json(laporan);
}
