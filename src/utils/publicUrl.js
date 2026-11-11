const env = require('../config/env');

/**
 * Mengubah path file yang disimpan di DB menjadi URL lengkap untuk aplikasi.
 *
 *   'reports/ab12.jpg'            -> 'http://localhost:3000/uploads/reports/ab12.jpg'
 *   'https://images.unsplash...'  -> dikembalikan apa adanya (data seed)
 *   null                          -> null
 */
function toPublicUrl(storedPath) {
  if (!storedPath) return null;
  if (/^https?:\/\//i.test(storedPath)) return storedPath;
  const base = env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  return `${base}/uploads/${storedPath.replace(/^\/+/, '')}`;
}

module.exports = { toPublicUrl };
