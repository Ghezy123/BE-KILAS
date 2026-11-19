const prisma = require('../lib/prisma');
const { ok } = require('../utils/apiResponse');
const { toPublicUrl } = require('../utils/publicUrl');

/**
 * GET /api/users/search?q=
 * Mencari pengguna berdasarkan username, nama, atau jurusan (maks. 20 hasil).
 * Jika query kosong, mengembalikan list kosong (awal pencarian kosong).
 */
async function searchUsers(req, res, next) {
  try {
    const rawQuery = (req.query.q || '').trim();
    const cleanQuery = rawQuery.startsWith('@') ? rawQuery.substring(1).trim() : rawQuery;

    // Jika belum mengetik atau query kosong, kembalikan array kosong
    if (!cleanQuery) {
      return ok(res, []);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: cleanQuery } },
          { nama: { contains: cleanQuery } },
          { jurusan: { contains: cleanQuery } },
        ],
      },
      select: {
        id: true,
        username: true,
        nama: true,
        bio: true,
        fotoProfil: true,
        fakultas: true,
        jurusan: true,
        reports: {
          select: {
            upvoteCount: true,
          },
        },
      },
      take: 20,
      orderBy: {
        username: 'asc',
      },
    });

    const mapped = users.map((u) => {
      const reportCount = u.reports.length;
      const totalUpvotes = u.reports.reduce((acc, curr) => acc + (curr.upvoteCount || 0), 0);

      return {
        user_id: u.id,
        username: u.username.startsWith('@') ? u.username : `@${u.username}`,
        nama: u.nama,
        bio: u.bio,
        foto_profil: toPublicUrl(u.fotoProfil),
        fakultas: u.fakultas,
        jurusan: u.jurusan,
        report_count: reportCount,
        total_upvotes: totalUpvotes,
      };
    });

    return ok(res, mapped);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:username
 * Mengembalikan profil publik pengguna berdasarkan username (untuk QR Profile & Profil Publik).
 */
async function getUserByUsername(req, res, next) {
  try {
    const rawUsername = (req.params.username || '').trim();
    const cleanUsername = rawUsername.startsWith('@') ? rawUsername.substring(1).trim() : rawUsername;

    if (!cleanUsername) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Username tidak valid' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
      select: {
        id: true,
        username: true,
        nama: true,
        bio: true,
        fotoProfil: true,
        fakultas: true,
        jurusan: true,
        reports: {
          select: {
            upvoteCount: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan' },
      });
    }

    const reportCount = user.reports.length;
    const totalUpvotes = user.reports.reduce((acc, curr) => acc + (curr.upvoteCount || 0), 0);

    return ok(res, {
      user_id: user.id,
      username: user.username.startsWith('@') ? user.username : `@${user.username}`,
      nama: user.nama,
      bio: user.bio,
      foto_profil: toPublicUrl(user.fotoProfil),
      fakultas: user.fakultas,
      jurusan: user.jurusan,
      report_count: reportCount,
      total_upvotes: totalUpvotes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/me/activities
 * Mengambil riwayat aktivitas pribadi user saat ini (FR-24 & FR-C6).
 */
async function getMyActivities(req, res, next) {
  try {
    const activities = await prisma.activityLog.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const actionMap = {
      buat_laporan: { type: 'buatLaporan', title: 'Menerbitkan Laporan' },
      ubah_laporan: { type: 'ubahLaporan', title: 'Memperbarui Laporan' },
      hapus_laporan: { type: 'hapusLaporan', title: 'Menghapus Laporan' },
    };

    const mapped = activities.map((a) => {
      const meta = actionMap[a.actionType] || {
        type: 'buatLaporan',
        title: 'Aktivitas Laporan',
      };
      return {
        id: a.id,
        action_type: meta.type,
        title: meta.title,
        description: a.reportTitle || '',
        timestamp: a.createdAt.toISOString(),
        report_id: a.reportId,
      };
    });

    return ok(res, mapped);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchUsers,
  getUserByUsername,
  getMyActivities,
};

