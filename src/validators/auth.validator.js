const { z } = require('zod');

/** String wajib dengan pesan Indonesia untuk field kosong / bukan teks. */
const requiredString = (label) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${label} wajib diisi` : `${label} harus berupa teks`),
  });

const email = requiredString('Email')
  .trim()
  .toLowerCase()
  .pipe(z.email('Format email tidak valid').max(120, 'Email maksimal 120 karakter'));

const register = z.object({
  email,
  username: requiredString('Username')
    .trim()
    .toLowerCase()
    .transform((v) => v.replace(/^@/, ''))
    .pipe(
      z
        .string()
        .regex(
          /^[a-z0-9_.]{3,30}$/,
          'Username 3–30 karakter, hanya huruf kecil, angka, titik, dan garis bawah',
        ),
    ),
  nama: requiredString('Nama')
    .trim()
    .min(1, 'Nama wajib diisi')
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  // bcrypt hanya memakai 72 byte pertama, jadi batasi agar tidak menyesatkan.
  password: requiredString('Password')
    .min(8, 'Password minimal 8 karakter')
    .max(72, 'Password maksimal 72 karakter'),
});

const login = z.object({
  email,
  password: requiredString('Password').min(1, 'Password wajib diisi'),
});

module.exports = { register, login };
