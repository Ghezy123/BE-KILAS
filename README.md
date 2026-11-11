# KILAS Backend

REST API untuk **KILAS (Kabar Lintas Andalas)**, aplikasi pelaporan kondisi kampus dan informasi penting di Universitas Andalas.
Tugas Besar Pemrograman Mobile, Kelompok 1 (B).

**Stack:** Node.js 22 · Express 5 · Prisma 6 · MySQL 8 · zod · CommonJS

---

## Persiapan pertama kali

> Versi singkat (hanya perintah): [INSTALL.md](INSTALL.md)

### 1. Prasyarat
- **Node.js 22** atau lebih baru (`node -v`)
- **MySQL 8**. Di Windows paling mudah lewat **Laragon** (klik *Start All*)

### 2. Buat database dan user MySQL
Buka terminal MySQL (Laragon: klik kanan tray → *MySQL* → *Console*, atau lewat HeidiSQL), lalu jalankan.
Ganti `PASSWORD_KAMU` dengan password pilihanmu sendiri.

```sql
CREATE DATABASE kilas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kilas'@'localhost' IDENTIFIED BY 'PASSWORD_KAMU';
-- *.* (bukan kilas_db.*) karena Prisma butuh membuat "shadow database" saat migrate dev.
-- Hanya untuk lokal. Di server produksi cukup kilas_db.* dan pakai `npm run db:deploy`.
GRANT ALL PRIVILEGES ON *.* TO 'kilas'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Isi file `.env`
`.env` tidak ikut ke Git. Salin dari contoh:

```bash
cp .env.example .env
```

Lalu ubah:
- `DATABASE_URL`: ganti `ganti_password_kuat` dengan password MySQL tadi. Kalau password berisi karakter khusus (`@ # /`), tulis versi URL-encode-nya.
- `JWT_SECRET`: isi string acak minimal 32 karakter. Bisa dibuat dengan:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

Server **menolak start** dan menampilkan variabel mana yang salah jika `.env` tidak lengkap.

### 4. Install dan siapkan database
```bash
npm install
npm run db:migrate     # membuat semua tabel dari prisma/migrations
```

### 5. Jalankan
```bash
npm run dev            # mode development, otomatis restart saat file berubah
```
Cek di browser: <http://localhost:3000/api/health>

**Akun contoh** (dari `npm run db:seed`): `ghezz@gmail.com` / `password123`. Daftar lengkap ada di `prisma/seed-data/users.js`; semua akun memakai password yang sama.

**Dari HP saat development:** emulator Android → `http://10.0.2.2:3000`; HP fisik → `http://<IP-laptop>:3000` (satu Wi-Fi).

---

## Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server + auto-restart (`node --watch`) |
| `npm start` | Jalankan server (produksi) |
| `npm run db:migrate` | Terapkan migrasi; jika `schema.prisma` berubah, buat migrasi baru (`npm run db:migrate -- --name nama_perubahan`) |
| `npm run db:deploy` | Terapkan migrasi di server produksi (tanpa membuat migrasi baru) |
| `npm run db:seed` | Isi data contoh |
| `npm run db:studio` | Buka Prisma Studio (lihat/ubah isi tabel di browser) |
| `npm run db:reset` | **Hapus semua data**, jalankan ulang migrasi + seed |

---

## Struktur folder

```
prisma/
  schema.prisma        Skema database (sumber kebenaran)
  migrations/          Riwayat migrasi. WAJIB di-commit, jangan diedit manual
src/
  server.js            Titik masuk: start server
  app.js               Susunan middleware & route
  config/env.js        Validasi .env (zod)
  lib/prisma.js        PrismaClient tunggal (password_hash di-omit otomatis)
  routes/              Definisi URL → middleware → controller
  controllers/         Baca request, panggil service, kirim respons
  services/            Logika bisnis & query database
  validators/          Skema zod untuk body/query/params
  middlewares/         auth (requireAuth), validate, errorHandler, (nanti: upload)
  jobs/                Job terjadwal (pengingat harian)
  utils/               AppError, apiResponse, jwt, userMapper, publicUrl, campusBoundary
uploads/               File upload (reports/, avatars/). Isinya tidak di-commit
docs/                  Dokumentasi API + koleksi Postman/Bruno
scripts/               Skrip pendukung (mis. menjalankan job manual)
```

Alur satu request: `routes` → `middlewares` (auth, validate) → `controllers` → `services` → Prisma → MySQL.
Jika terjadi error, cukup `throw` (`AppError` atau error biasa); Express 5 meneruskannya ke `errorHandler`.

File `.gitkeep` hanya agar folder kosong ikut ke Git. Di `src/` boleh dihapus setelah folder berisi file; di `uploads/` **jangan dihapus**.

---

## Konvensi

- **Format respons** (dari `src/utils/apiResponse.js`):
  ```json
  { "success": true,  "data": { } }
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ ] } }
  ```
- **Pesan error** dalam Bahasa Indonesia yang ramah, karena aplikasi menampilkannya langsung di snackbar.
- **Field JSON** di respons memakai `snake_case`; kode JavaScript memakai `camelCase`.
- **Waktu** disimpan dan dikirim dalam UTC (ISO 8601); konversi WIB hanya saat menghitung "hari ini / bulan ini".
- **Otorisasi** selalu dari `req.userId` (token), bukan dari body/params.

---

## Keputusan proyek

| Keputusan | Alasan |
|---|---|
| **Prisma dikunci di v6** (jangan `npm i prisma@latest`) | Skema memakai gaya v6 (`url` di `datasource`). Prisma 7+ memindahkan koneksi ke `prisma.config.ts` dan mewajibkan driver adapter |
| **CommonJS** (`require`) | Paling banyak contoh untuk Express/multer/Prisma; tidak perlu menulis ekstensi `.js` di import |
| `node --watch`, bukan nodemon | Bawaan Node 22, satu dependency lebih sedikit |
| Peringatan `package.json#prisma is deprecated` | Aman diabaikan selama di Prisma 6 |
| Temuan `npm audit` pada `deepmerge-ts` | Dipakai Prisma saat membaca konfigurasinya, bukan untuk input pengguna. Perbaikannya hanya lewat Prisma 7 |
| Polygon kampus disalin di `src/utils/campusBoundary.js` | Harus sama dengan Flutter `lib/widgets/map/campus_boundary.dart`. **Ubah di dua tempat** jika batas kampus berubah |
| Sesi JWT 90 hari, diperbarui di `GET /auth/me` | User tetap login sampai logout manual |
| Log aktivitas hanya buat/ubah/hapus laporan | Upvote & bookmark tidak dicatat (mencegah spam) |
| Firebase hanya untuk FCM (push notification) | Produk Firebase lain dilarang; riwayat notifikasi tetap di MySQL |
