import { prisma } from "./prisma";

// Hitung ulang terkumpulRp kampanye dari donasi berstatus terkonfirmasi.
export async function hitungUlangTerkumpul(kampanyeId: number) {
  const agg = await prisma.donasi.aggregate({
    _sum: { nominalRp: true },
    where: { kampanyeId, status: "terkonfirmasi" },
  });
  const total = agg._sum.nominalRp ?? 0;
  await prisma.kampanye.update({
    where: { id: kampanyeId },
    data: { terkumpulRp: total },
  });
  return total;
}

// Kode unik acak 100-999 yang belum dipakai donasi pending di kampanye ini.
export async function buatKodeUnik(kampanyeId: number) {
  const pending = await prisma.donasi.findMany({
    where: { kampanyeId, status: "pending" },
    select: { kodeUnik: true },
  });
  const terpakai = new Set(pending.map((d) => d.kodeUnik));
  for (let i = 0; i < 50; i++) {
    const kode = 100 + Math.floor(Math.random() * 900);
    if (!terpakai.has(kode)) return kode;
  }
  return 100 + Math.floor(Math.random() * 900);
}
