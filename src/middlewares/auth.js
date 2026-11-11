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

module.exports = { requireAuth };
