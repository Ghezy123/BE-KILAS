const env = require('./config/env');
const app = require('./app');
const prisma = require('./lib/prisma');

const server = app.listen(env.PORT, () => {
  console.log(`KILAS API berjalan di http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal) {
  console.log(`${signal} diterima, mematikan server...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
