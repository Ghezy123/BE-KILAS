/**
 * Akun contoh untuk login.
 * Sumber: Flutter lib/screens/profile/data/campus_users_data.dart
 *
 * Penyesuaian dari data dummy Flutter:
 *  - username tanpa "@" dan huruf kecil
 *  - email = <username>@gmail.com (dummy Flutter tidak punya email)
 *  - jurusan tanpa angkatan ("Sistem Informasi '24" -> "Sistem Informasi")
 *  - akun organisasi (@unand_official, Biro Umum, BEM, dll.) belum dimasukkan;
 *    menyusul bersama seed laporan
 *
 * Semua akun memakai password yang sama: SEED_PASSWORD di prisma/seed.js.
 */
module.exports = [
  {
    username: 'ghezz',
    nama: 'Ghezy Pramudinata .B',
    fakultas: 'Fakultas Teknologi Informasi',
    jurusan: 'Sistem Informasi',
    bio: 'Aktif melaporkan fasilitas dan situasi di lingkungan kampus Limau Manis UNAND.',
    fotoProfil:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    username: 'ahmadfauzan',
    nama: 'Ahmad Fauzan .S',
    fakultas: 'Fakultas Teknologi Informasi',
    jurusan: 'Teknik Komputer',
    bio: 'Aktif mengabarkan info pemeliharaan server, jaringan Wi-Fi, dan lab komputer UNAND.',
    fotoProfil:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  },
  {
    username: 'aziz_hakim',
    nama: 'Aziz Hakim',
    fakultas: 'Fakultas Teknik',
    jurusan: 'Teknik Mesin',
    bio: 'Suka berbagi laporan sarana prasarana, parkiran, dan kelancaran lalu lintas kampus.',
  },
  {
    username: 'fadhil_r',
    nama: 'Fadhil Ramadhan',
    fakultas: 'Fakultas Teknik',
    jurusan: 'Teknik Sipil',
    bio: 'Pemerhati infrastruktur jalan, drainase air, dan keamanan gedung kuliah.',
  },
  {
    username: 'putrianisa',
    nama: 'Putri Anisa',
    fakultas: 'Fakultas Farmasi',
    jurusan: 'Farmasi',
    bio: 'Pemberi info kesehatan lingkungan, kebersihan kafetaria, dan poliklinik UNAND.',
  },
  {
    username: 'dikipratama',
    nama: 'Diki Pratama',
    fakultas: 'Fakultas Hukum',
    jurusan: 'Ilmu Hukum',
    bio: 'Menjunjung transparansi informasi fasilitas dan ketertiban mahasiswa kampus.',
  },
  {
    username: 'sitirahma',
    nama: 'Siti Rahma',
    fakultas: 'Fakultas Kedokteran',
    jurusan: 'Pendidikan Dokter',
    bio: 'Siaga informasi kesehatan civitas akademika dan sanitasi fasilitas kampus.',
  },
  {
    username: 'riansaputra',
    nama: 'Rian Saputra',
    fakultas: 'Fakultas Peternakan',
    jurusan: 'Peternakan',
    bio: 'Sering membagikan info fasilitas riset, kandang percobaan, dan lingkungan alam kampus.',
  },
  {
    username: 'ilham_p',
    nama: 'Ilham Pratama',
    fakultas: 'FMIPA',
    jurusan: 'Biologi',
    bio: 'Peduli kelestarian flora fauna, laboratorium sains, dan ekosistem kampus Limau Manis.',
  },
  {
    username: 'nabilakh',
    nama: 'Nabila Khairunisa',
    fakultas: 'Fakultas Ekonomi dan Bisnis',
    jurusan: 'Manajemen',
    bio: 'Aktif di kegiatan organisasi mahasiswa, ruang seminar, dan pusat kegiatan belajar.',
  },
];
