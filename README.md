# Donasi Masjid Transparan

Donasi masjid/panti dengan kode unik pembayaran, rekonsiliasi otomatis,
laporan transparan, dan penutupan periode yang dikunci hash SHA-256.

## Cara Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

## Halaman

- `/` — Dashboard: daftar kampanye dengan progress bar target vs terkumpul,
  form buat kampanye.
- `/kampanye/[id]` — Detail kampanye (admin): kelola donasi (tambah, konfirmasi
  manual, batalkan, rekonsiliasi otomatis), catat pengeluaran + upload bukti,
  tutup periode.
- `/laporan/[id]` — Laporan publik transparan (tanpa login): donasi
  terkonfirmasi (nama disamarkan), pengeluaran + bukti, total masuk/keluar/saldo,
  badge TERKUNCI + hash bila periode sudah ditutup.

## API

| Method | Path | Deskripsi |
|---|---|---|
| GET/POST | /api/kampanye | List / buat kampanye |
| GET/PATCH/DELETE | /api/kampanye/[id] | Detail / ubah / hapus |
| POST | /api/kampanye/[id]/tutup | Tutup periode + hash SHA-256 |
| GET | /api/kampanye/[id]/laporan | Laporan publik (JSON) |
| GET/POST | /api/donasi | List / buat donasi (kode unik 100–999) |
| PATCH | /api/donasi/[id] | Ubah status donasi |
| POST | /api/donasi/rekonsiliasi | Cocokkan total transfer → konfirmasi |
| GET/POST | /api/pengeluaran | List / catat pengeluaran (+upload bukti) |
| DELETE | /api/pengeluaran/[id] | Hapus pengeluaran |

## Aturan Bisnis

- Setiap donasi mendapat kode unik acak 100–999; total transfer = nominal + kode unik.
- Rekonsiliasi mencari donasi `pending` dengan total transfer yang cocok lalu
  mengonfirmasinya.
- Setelah kampanye ditutup, donasi baru dan pengeluaran baru ditolak (409).
- Penutupan menyimpan hash SHA-256 dari ringkasan laporan sebagai segel integritas.
