import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const iso = () => new Date().toISOString();

async function main() {
  const n = await prisma.kampanye.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }

  const k1 = await prisma.kampanye.create({
    data: {
      nama: "Renovasi Atap Masjid Al-Ikhlas",
      deskripsi:
        "Penggalangan dana untuk mengganti atap masjid yang bocor dan memperbaiki plafon ruang utama.",
      targetRp: 50000000,
      tenggat: "2026-12-31",
      status: "aktif",
      createdAt: iso(),
    },
  });
  const k2 = await prisma.kampanye.create({
    data: {
      nama: "Pengadaan Ambulans Masjid",
      deskripsi:
        "Pengadaan satu unit ambulans untuk layanan antar-jemput jenazah dan darurat warga sekitar masjid.",
      targetRp: 120000000,
      tenggat: "2027-03-31",
      status: "aktif",
      createdAt: iso(),
    },
  });

  // Donasi kampanye 1: 3 terkonfirmasi + 1 pending
  const donasiK1 = [
    { donaturNama: "Hamba Allah", nominalRp: 1000000, kodeUnik: 123, status: "terkonfirmasi", metode: "transfer" },
    { donaturNama: "Budi Santoso", nominalRp: 500000, kodeUnik: 456, status: "terkonfirmasi", metode: "qris" },
    { donaturNama: "Siti Aminah", nominalRp: 250000, kodeUnik: 789, status: "terkonfirmasi", metode: "transfer" },
    { donaturNama: "Andi Wijaya", nominalRp: 2000000, kodeUnik: 321, status: "pending", metode: "transfer" },
  ];
  for (const d of donasiK1) {
    await prisma.donasi.create({
      data: {
        kampanyeId: k1.id,
        donaturNama: d.donaturNama,
        nominalRp: d.nominalRp,
        kodeUnik: d.kodeUnik,
        totalTransferRp: d.nominalRp + d.kodeUnik,
        status: d.status,
        metode: d.metode,
        createdAt: iso(),
      },
    });
  }

  // Donasi kampanye 2: 2 terkonfirmasi + 1 pending
  const donasiK2 = [
    { donaturNama: "Hamba Allah", nominalRp: 5000000, kodeUnik: 234, status: "terkonfirmasi", metode: "transfer" },
    { donaturNama: "Dewi Lestari", nominalRp: 1500000, kodeUnik: 567, status: "terkonfirmasi", metode: "tunai" },
    { donaturNama: "Rudi Hartono", nominalRp: 3000000, kodeUnik: 890, status: "pending", metode: "transfer" },
  ];
  for (const d of donasiK2) {
    await prisma.donasi.create({
      data: {
        kampanyeId: k2.id,
        donaturNama: d.donaturNama,
        nominalRp: d.nominalRp,
        kodeUnik: d.kodeUnik,
        totalTransferRp: d.nominalRp + d.kodeUnik,
        status: d.status,
        metode: d.metode,
        createdAt: iso(),
      },
    });
  }

  // Hitung ulang terkumpul dari donasi terkonfirmasi
  for (const k of [k1, k2]) {
    const agg = await prisma.donasi.aggregate({
      _sum: { nominalRp: true },
      where: { kampanyeId: k.id, status: "terkonfirmasi" },
    });
    await prisma.kampanye.update({
      where: { id: k.id },
      data: { terkumpulRp: agg._sum.nominalRp ?? 0 },
    });
  }

  await prisma.pengeluaran.createMany({
    data: [
      {
        kampanyeId: k1.id,
        keterangan: "Pembelian seng atap 200 lembar",
        nominalRp: 8500000,
        tanggal: "2026-09-20",
        penerima: "Toko Bangunan Jaya",
        createdAt: iso(),
      },
      {
        kampanyeId: k1.id,
        keterangan: "Upah tukang tahap 1",
        nominalRp: 5000000,
        tanggal: "2026-09-25",
        penerima: "Pak Slamet",
        createdAt: iso(),
      },
      {
        kampanyeId: k2.id,
        keterangan: "DP unit ambulans",
        nominalRp: 30000000,
        tanggal: "2026-09-28",
        penerima: "Dealer Mobil Sejahtera",
        createdAt: iso(),
      },
    ],
  });

  console.log("seed selesai: 2 kampanye, 7 donasi, 3 pengeluaran");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
