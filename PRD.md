# PRD — Donasi Masjid Transparan

## 1. Ringkasan
Aplikasi donasi untuk masjid/panti dengan kode unik pembayaran, pencocokan
(rekonsiliasi) otomatis, pencatatan pengeluaran berbukti, penutupan periode
yang dikunci hash SHA-256, dan laporan publik yang transparan.

## 2. Stack
Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS. UI berbahasa
Indonesia. Tanggal disimpan sebagai TEXT `YYYY-MM-DD`, timestamp sebagai
TEXT ISO. ID: `Int @id @default(autoincrement())`.

## 3. Model Data

### Kampanye
- `nama` String, `deskripsi` String, `targetRp` Int, `terkumpulRp` Int (default 0,
  dihitung ulang dari donasi berstatus `terkonfirmasi` setiap ada perubahan status)
- `tenggat` String (YYYY-MM-DD), `status` String: `aktif` | `ditutup` (default `aktif`)
- `createdAt` String (ISO)

### Donasi
- `kampanyeId` Int (FK), `donaturNama` String, `nominalRp` Int
- `kodeUnik` Int (acak 100–999, unik di antara donasi `pending` per kampanye)
- `totalTransferRp` Int = `nominalRp` + `kodeUnik`
- `status` String: `pending` | `terkonfirmasi` | `batal` (default `pending`)
- `metode` String (mis. `transfer`, `tunai`, `qris`), `createdAt` String (ISO)

### Pengeluaran
- `kampanyeId` Int (FK), `keterangan` String, `nominalRp` Int
- `tanggal` String (YYYY-MM-DD), `penerima` String
- `buktiUrl` String? (path file di `public/uploads/`), `createdAt` String (ISO)

### PenutupanPeriode
- `kampanyeId` Int (unique FK), `ditutupPada` String (ISO)
- `hashLaporan` String (SHA-256 hex dari JSON ringkasan)
- `ringkasan` String (JSON: total donasi terkonfirmasi, total pengeluaran,
  saldo, jumlah donasi, jumlah pengeluaran, timestamp)

## 4. Fungsionalitas

### F0 — Setup
Schema Prisma, seed (2 kampanye aktif + donasi contoh + pengeluaran contoh),
layout, `lib/prisma.ts` singleton, `lib/format.ts` (rupiah, tanggal, samarkan nama).

### F1 — Kampanye CRUD + Dashboard
- `GET /api/kampanye` — daftar kampanye
- `POST /api/kampanye` — buat kampanye `{nama, deskripsi, target_rp, tenggat}`;
  400 bila nama kosong / target ≤ 0 / tenggat bukan YYYY-MM-DD
- `GET /api/kampanye/[id]` — detail + relasi (donasi, pengeluaran, penutupan)
- `PATCH /api/kampanye/[id]` — ubah kampanye; 404 bila tidak ada, 409 bila
  kampanye sudah ditutup
- `DELETE /api/kampanye/[id]` — hapus; 409 bila masih punya donasi/pengeluaran/penutupan
- Dashboard `/` : daftar kampanye dengan progress bar target vs terkumpul,
  badge status, tautan detail & laporan publik, form buat kampanye.

### F2 — Donasi + Kode Unik + Rekonsiliasi
- `POST /api/donasi` `{kampanye_id, donatur_nama, nominal_rp, metode}` →
  201 `{..., kode_unik, total_transfer_rp}`; 400 bila field tidak valid;
  404 bila kampanye tidak ada; **409 bila kampanye sudah ditutup**
- `GET /api/donasi?kampanye_id=` — daftar donasi per kampanye
- `POST /api/donasi/rekonsiliasi` `{total_transfer_rp, kampanye_id}` → cari
  donasi `pending` dengan total cocok (pertama, terlama) → set `terkonfirmasi`,
  hitung ulang `terkumpulRp`; 200 bila cocok, 404 bila tidak ada yang cocok
- `PATCH /api/donasi/[id]` `{status}` — konfirmasi manual / batalkan;
  400 bila status tidak dikenal; setiap perubahan yang memengaruhi total
  memicu hitung ulang `terkumpulRp`

### F3 — Pengeluaran + Bukti
- `POST /api/pengeluaran` (multipart FormData: `kampanye_id`, `keterangan`,
  `nominal_rp`, `tanggal`, `penerima`, `bukti` file) → simpan file ke
  `public/uploads/`, simpan path di `bukti_url`; 201; 400 bila field tidak
  valid / file > 5 MB / tipe tidak didukung (jpg, jpeg, png, webp, pdf);
  **409 bila kampanye sudah ditutup**
- `GET /api/pengeluaran?kampanye_id=` — daftar pengeluaran per kampanye
- `DELETE /api/pengeluaran/[id]` — hapus record + file buktinya
- Halaman detail kampanye: form catat pengeluaran + upload bukti, daftar
  pengeluaran dengan pratinjau gambar bukti.

### F4 — Penutupan Periode (Terkunci)
- `POST /api/kampanye/[id]/tutup` → hitung ringkasan, hash SHA-256 dari JSON
  ringkasan, simpan `PenutupanPeriode`, set kampanye `ditutup`; 201;
  404 bila kampanye tidak ada; **409 bila sudah ditutup sebelumnya**
- Setelah ditutup: `POST /api/donasi` dan `POST /api/pengeluaran` untuk
  kampanye itu → **409**
- Laporan menampilkan badge "TERKUNCI" + hash.

### F5 — Laporan Publik Transparan
- Halaman `/laporan/[kampanye_id]` (tanpa login): info kampanye, progress bar,
  daftar donasi **terkonfirmasi** (nama disamarkan, mis. "Budi S***" → "B***"),
  daftar pengeluaran lengkap dengan tautan/pratinjau bukti,
  total masuk / total keluar / saldo, badge TERKUNCI + hash bila ditutup.
- `GET /api/kampanye/[id]/laporan` — JSON laporan yang sama.

## 5. API Ringkas
| Method | Path | Deskripsi |
|---|---|---|
| GET/POST | /api/kampanye | List / buat kampanye |
| GET/PATCH/DELETE | /api/kampanye/[id] | Detail / ubah / hapus |
| POST | /api/kampanye/[id]/tutup | Tutup periode + hash |
| GET | /api/kampanye/[id]/laporan | Laporan publik (JSON) |
| GET/POST | /api/donasi | List / buat donasi (kode unik) |
| PATCH | /api/donasi/[id] | Ubah status donasi |
| POST | /api/donasi/rekonsiliasi | Cocokkan total transfer |
| GET/POST | /api/pengeluaran | List / catat pengeluaran (+upload) |
| DELETE | /api/pengeluaran/[id] | Hapus pengeluaran |

## 6. Seed
2 kampanye aktif ("Renovasi Atap Masjid Al-Ikhlas", "Pengadaan Ambulans Masjid"),
donasi contoh (terkonfirmasi + pending), pengeluaran contoh. Seed hanya jalan
bila tabel kampanye kosong.
