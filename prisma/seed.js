/**
 * Seed data contoh.  Jalankan: npm run db:seed
 *
 * Saat ini HANYA akun pengguna (untuk uji login).
 * Laporan, media, upvote, bookmark, notifikasi, dan aktivitas menyusul.
 *
 * Aman dijalankan berulang: akun di-upsert berdasarkan username, jadi
 * user_id tetap sama dan password dikembalikan ke SEED_PASSWORD.
 */
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');
const users = require('./seed-data/users');

const SEED_PASSWORD = 'password123';
const BCRYPT_COST = 10;
const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;

async function seedUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_COST);

  for (const u of users) {
    // Pastikan data seed sendiri lolos aturan validasi yang sama dengan API.
    if (!USERNAME_REGEX.test(u.username)) throw new Error(`Username seed tidak valid: ${u.username}`);
    if ((u.bio ?? '').length > 300) throw new Error(`Bio ${u.username} lebih dari 300 karakter`);

    const data = {
      email: `${u.username}@gmail.com`,
      passwordHash,
      nama: u.nama,
      bio: u.bio ?? null,
      fotoProfil: u.fotoProfil ?? null,
      fakultas: u.fakultas || null,
      jurusan: u.jurusan || null,
      pengingatAktif: true,
    };

    await prisma.user.upsert({
      where: { username: u.username },
      create: { username: u.username, ...data },
      update: data,
    });
  }

  console.log(`✔ ${users.length} akun siap (password: ${SEED_PASSWORD})`);
}

async function main() {
  await seedUsers();
}

main()
  .catch((err) => {
    console.error('Seed gagal:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
