import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { nowISO } from "@/lib/format";

const TGL = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["jpg", "jpeg", "png", "webp", "pdf"];

export async function GET(req: NextRequest) {
  const kampanyeId = req.nextUrl.searchParams.get("kampanye_id");
  const where = kampanyeId ? { kampanyeId: Number(kampanyeId) } : {};
  const rows = await prisma.pengeluaran.findMany({
    where,
    orderBy: { id: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "body harus multipart/form-data" }, { status: 400 });
  }

  const kampanyeId = Number(form.get("kampanye_id"));
  const keterangan = String(form.get("keterangan") ?? "").trim();
  const nominalRp = Number(form.get("nominal_rp"));
  const tanggal = String(form.get("tanggal") ?? "").trim();
  const penerima = String(form.get("penerima") ?? "").trim();
  const bukti = form.get("bukti");

  if (!Number.isInteger(kampanyeId))
    return NextResponse.json({ error: "kampanye_id tidak valid" }, { status: 400 });
  if (!keterangan)
    return NextResponse.json({ error: "keterangan wajib diisi" }, { status: 400 });
  if (!Number.isInteger(nominalRp) || nominalRp <= 0)
    return NextResponse.json(
      { error: "nominal_rp harus bilangan bulat lebih dari 0" },
      { status: 400 }
    );
  if (!TGL.test(tanggal))
    return NextResponse.json(
      { error: "tanggal harus berformat YYYY-MM-DD" },
      { status: 400 }
    );
  if (!penerima)
    return NextResponse.json({ error: "penerima wajib diisi" }, { status: 400 });

  const k = await prisma.kampanye.findUnique({ where: { id: kampanyeId } });
  if (!k)
    return NextResponse.json({ error: "kampanye tidak ditemukan" }, { status: 404 });
  if (k.status === "ditutup")
    return NextResponse.json(
      { error: "kampanye sudah ditutup, pengeluaran baru tidak diterima" },
      { status: 409 }
    );

  let buktiUrl: string | null = null;
  if (bukti && typeof bukti !== "string" && bukti.size > 0) {
    const file = bukti as File;
    if (file.size > MAX_SIZE)
      return NextResponse.json(
        { error: "ukuran bukti maksimal 5 MB" },
        { status: 400 }
      );
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED.includes(ext))
      return NextResponse.json(
        { error: `tipe bukti tidak didukung (boleh: ${ALLOWED.join(", ")})` },
        { status: 400 }
      );
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const namaFile = `${Date.now()}-${safeName}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, namaFile), buf);
    buktiUrl = `/uploads/${namaFile}`;
  }

  const created = await prisma.pengeluaran.create({
    data: {
      kampanyeId,
      keterangan,
      nominalRp,
      tanggal,
      penerima,
      buktiUrl,
      createdAt: nowISO(),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
