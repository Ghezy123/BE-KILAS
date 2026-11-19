const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

const REPORTS_DIR = path.join(__dirname, '..', '..', 'uploads', 'reports');
const AVATARS_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

// Pastikan folder penyimpanan tersedia
for (const dir of [REPORTS_DIR, AVATARS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
]);

const reportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, REPORTS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${randomHex}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return cb(
      AppError.mediaInvalid(
        'Format file tidak didukung. Unggah foto (JPG, PNG, WEBP) atau video (MP4, MOV)',
      ),
    );
  }
  cb(null, true);
}

// Multer instance untuk media laporan (maksimal 5 file, batas file tunggal 25MB)
const uploadReportMedia = multer({
  storage: reportStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
    files: 5,
  },
  fileFilter,
}).array('media', 5);

module.exports = {
  uploadReportMedia,
  REPORTS_DIR,
  AVATARS_DIR,
};
