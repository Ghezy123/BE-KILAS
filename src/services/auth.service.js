const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const { toOwnUser } = require('../utils/userMapper');

const BCRYPT_COST = 10;

// Hash palsu untuk menyamakan waktu respons saat email tidak terdaftar,
// supaya penyerang tidak bisa menebak email mana yang terdaftar dari lamanya respons.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

function session(user) {
  return { token: signToken(user.id), user: toOwnUser(user) };
}

async function register({ email, username, nama, password }) {
  // Cek dulu agar pesan jelas; unique constraint DB tetap jadi pengaman terakhir (P2002 -> 409).
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  });
  if (existing) {
    throw AppError.duplicate(existing.email === email ? 'Email sudah terdaftar' : 'Username sudah dipakai');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: { email, username, nama, passwordHash },
  });
  return session(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    omit: { passwordHash: false },
  });

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw AppError.invalidCredentials();

  return session(user);
}

/** Sliding session: setiap aplikasi dibuka, kembalikan token baru 90 hari. */
async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.tokenInvalid(); // akun sudah tidak ada
  return session(user);
}

module.exports = { register, login, me };
