const authService = require('../services/auth.service');
const { ok, created, noContent } = require('../utils/apiResponse');

async function register(req, res) {
  created(res, await authService.register(req.body));
}

async function login(req, res) {
  ok(res, await authService.login(req.body));
}

async function me(req, res) {
  ok(res, await authService.me(req.userId));
}

// Server tidak menyimpan sesi: aplikasi cukup menghapus JWT-nya
// (token FCM dihapus terpisah lewat DELETE /users/me/devices/:fcmToken).
function logout(req, res) {
  noContent(res);
}

module.exports = { register, login, me, logout };
