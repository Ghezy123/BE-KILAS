const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { ok } = require('./utils/apiResponse');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Jika nanti di belakang Nginx/tunnel, aktifkan agar req.ip & rate limit benar:
// app.set('trust proxy', 1);

app.use(
  helmet({
    // Gambar/video di /uploads boleh dimuat dari origin lain.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// File upload (foto profil & media laporan). File diawali titik (.gitkeep) tidak disajikan.
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), { index: false, maxAge: '7d' }),
);

app.get('/api/health', (req, res) => {
  ok(res, { status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', require('./routes/auth.routes'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
