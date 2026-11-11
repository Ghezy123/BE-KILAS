require('dotenv').config({ quiet: true });
const { z } = require('zod');

// Validasi .env saat start: server menolak jalan jika ada yang kurang/salah.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().startsWith('mysql://'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter'),
  JWT_EXPIRES_IN: z.string().default('90d'),

  PUBLIC_BASE_URL: z.url(),

  MAX_IMAGE_MB: z.coerce.number().positive().default(5),
  MAX_VIDEO_MB: z.coerce.number().positive().default(25),
  MAX_MEDIA_PER_REPORT: z.coerce.number().int().positive().default(5),

  // Jangan z.coerce.boolean(): string "false" akan terbaca true.
  ENABLE_CRON: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  REMINDER_CRON: z.string().default('0 16 * * *'),
  APP_TIMEZONE: z.string().default('Asia/Jakarta'),

  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().default('./firebase-service-account.json'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Konfigurasi .env tidak valid:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

module.exports = parsed.data;
