const { PrismaClient } = require('@prisma/client');
// password_hash tidak pernah ikut terambil kecuali diminta eksplisit:
// prisma.user.findUnique({ where, omit: { passwordHash: false } })
//
// Log 'error' Prisma sengaja tidak dinyalakan: error yang wajar (mis. email ganda
// P2002) sudah ditangani errorHandler, dan error tak terduga dicatat di sana.
const prisma = new PrismaClient({
  omit: { user: { passwordHash: true } },
  log: ['warn'],
});

module.exports = prisma;
