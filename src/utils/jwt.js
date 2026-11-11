const { randomUUID } = require('node:crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ALGORITHM = 'HS256';

/** Token sesi untuk satu user. Masa berlaku: JWT_EXPIRES_IN (90d). */
function signToken(userId) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    // jwtid unik: token selalu berbeda walau diterbitkan di detik yang sama.
    jwtid: randomUUID(),
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: ALGORITHM,
  });
}

/**
 * Mengembalikan userId jika token valid.
 * Melempar error dari jsonwebtoken jika token rusak/kedaluwarsa.
 */
function verifyToken(token) {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  if (!payload.sub) throw new jwt.JsonWebTokenError('Token tanpa subject');
  return payload.sub;
}

module.exports = { signToken, verifyToken };
