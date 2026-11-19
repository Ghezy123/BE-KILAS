const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

/**
 * Wajib login. Membaca header `Authorization: Bearer <token>`
 * dan mengisi req.userId. Pakai di semua endpoint bertanda 🔒.
 */
function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return next(AppError.unauthenticated());
  }

  try {
    req.userId = verifyToken(token);
  } catch {
    return next(AppError.tokenInvalid());
  }
  next();
}

/**
 * Autentikasi opsional. Jika token ada dan valid, req.userId terisi.
 * Jika tidak ada atau tidak valid, req.userId bernilai null dan request tetap lanjut.
 * Cocok untuk feed publik di mana status upvote/bookmark user aktif disesuaikan jika login.
 */
function optionalAuth(req, res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() === 'bearer' && token) {
    try {
      req.userId = verifyToken(token);
    } catch {
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };

