export const rupiah = (n: number) =>
  "Rp" + Math.round(n).toLocaleString("id-ID");

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const nowISO = () => new Date().toISOString();

export const formatTanggal = (tgl: string) => {
  const bulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tgl);
  if (!m) return tgl;
  return `${parseInt(m[3], 10)} ${bulan[parseInt(m[2], 10) - 1]} ${m[1]}`;
};

// Samarkan nama donatur untuk laporan publik, mis. "Budi Santoso" -> "B***"
export const samarkanNama = (nama: string) => {
  const t = nama.trim();
  if (!t) return "***";
  return t.charAt(0).toUpperCase() + "***";
};

export const persen = (terkumpul: number, target: number) =>
  target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
