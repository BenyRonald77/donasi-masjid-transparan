import { prisma } from "./prisma";
import { samarkanNama } from "./format";

export interface LaporanRingkasan {
  kampanye_id: number;
  nama: string;
  target_rp: number;
  total_donasi_terkonfirmasi_rp: number;
  total_pengeluaran_rp: number;
  saldo_rp: number;
  jumlah_donasi_terkonfirmasi: number;
  jumlah_pengeluaran: number;
  ditutup_pada: string;
}

// Susun data laporan publik untuk satu kampanye (dipakai API + halaman).
export async function susunLaporan(kampanyeId: number) {
  const k = await prisma.kampanye.findUnique({
    where: { id: kampanyeId },
    include: {
      donasi: { orderBy: { id: "desc" } },
      pengeluaran: { orderBy: { tanggal: "desc" } },
      penutupan: true,
    },
  });
  if (!k) return null;

  const donasiOk = k.donasi.filter((d) => d.status === "terkonfirmasi");
  const totalMasuk = donasiOk.reduce((s, d) => s + d.nominalRp, 0);
  const totalKeluar = k.pengeluaran.reduce((s, p) => s + p.nominalRp, 0);

  return {
    kampanye: {
      id: k.id,
      nama: k.nama,
      deskripsi: k.deskripsi,
      target_rp: k.targetRp,
      terkumpul_rp: totalMasuk,
      tenggat: k.tenggat,
      status: k.status,
    },
    donasi: donasiOk.map((d) => ({
      id: d.id,
      donatur: samarkanNama(d.donaturNama),
      nominal_rp: d.nominalRp,
      metode: d.metode,
      created_at: d.createdAt,
    })),
    pengeluaran: k.pengeluaran.map((p) => ({
      id: p.id,
      keterangan: p.keterangan,
      nominal_rp: p.nominalRp,
      tanggal: p.tanggal,
      penerima: p.penerima,
      bukti_url: p.buktiUrl,
    })),
    total_masuk_rp: totalMasuk,
    total_keluar_rp: totalKeluar,
    saldo_rp: totalMasuk - totalKeluar,
    terkunci: k.status === "ditutup",
    penutupan: k.penutupan
      ? {
          ditutup_pada: k.penutupan.ditutupPada,
          hash_laporan: k.penutupan.hashLaporan,
          ringkasan: JSON.parse(k.penutupan.ringkasan),
        }
      : null,
  };
}
