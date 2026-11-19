const { z } = require('zod');

// Normalisasi kategori dari label UI atau enum database
const categorySchema = z.string().transform((val, ctx) => {
  const normalized = val.trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'kondisi_kampus' || normalized === 'kondisikampus') {
    return 'kondisi_kampus';
  }
  if (
    normalized === 'informasi_penting' ||
    normalized === 'informasipenting' ||
    normalized === 'info_penting' ||
    normalized === 'infopenting'
  ) {
    return 'informasi_penting';
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Kategori harus berupa "Kondisi Kampus" atau "Informasi Penting"',
  });
  return z.NEVER;
});

const createReport = z.object({
  category: categorySchema,
  title: z
    .string({ required_error: 'Judul laporan wajib diisi' })
    .trim()
    .min(3, 'Judul minimal 3 karakter')
    .max(120, 'Judul maksimal 120 karakter'),
  description: z
    .string({ required_error: 'Keterangan laporan wajib diisi' })
    .trim()
    .min(5, 'Keterangan minimal 5 karakter')
    .max(1500, 'Keterangan maksimal 1500 karakter'),
  latitude: z.coerce
    .number({ required_error: 'Koordinat latitude wajib ada' })
    .min(-90, 'Latitude tidak valid')
    .max(90, 'Latitude tidak valid'),
  longitude: z.coerce
    .number({ required_error: 'Koordinat longitude wajib ada' })
    .min(-180, 'Longitude tidak valid')
    .max(180, 'Longitude tidak valid'),
  location_name: z
    .string()
    .trim()
    .max(150, 'Nama lokasi maksimal 150 karakter')
    .optional()
    .nullable(),
});

const updateReport = z.object({
  category: categorySchema.optional(),
  title: z
    .string()
    .trim()
    .min(3, 'Judul minimal 3 karakter')
    .max(120, 'Judul maksimal 120 karakter')
    .optional(),
  description: z
    .string()
    .trim()
    .min(5, 'Keterangan minimal 5 karakter')
    .max(1500, 'Keterangan maksimal 1500 karakter')
    .optional(),
  kept_media_ids: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // Jika dipisahkan koma
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
      return [];
    }),
});

const getReportsQuery = z.object({
  category: z.enum(['kondisi_kampus', 'informasi_penting']).optional(),
  q: z.string().trim().optional(),
  sort: z.enum(['terbaru', 'terpopuler']).default('terbaru'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  user_id: z.string().uuid().optional(),
  username: z.string().trim().optional(),
  bookmarked: z.coerce.boolean().optional(),
});

module.exports = {
  createReport,
  updateReport,
  getReportsQuery,
};
