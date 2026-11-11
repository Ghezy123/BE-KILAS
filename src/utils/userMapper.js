const { toPublicUrl } = require('./publicUrl');

/**
 * User milik sendiri (/auth/*, /users/me): termasuk email & pengingat_aktif.
 * Bentuk sesuai KONTEKS_BACKEND §6.4. password_hash tidak pernah ikut.
 */
function toOwnUser(user) {
  return {
    user_id: user.id,
    email: user.email,
    username: user.username,
    nama: user.nama,
    bio: user.bio,
    foto_profil: toPublicUrl(user.fotoProfil),
    fakultas: user.fakultas,
    jurusan: user.jurusan,
    pengingat_aktif: user.pengingatAktif,
  };
}

module.exports = { toOwnUser };
