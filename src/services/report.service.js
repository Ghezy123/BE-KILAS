const path = require('node:path');
const fs = require('node:fs').promises;
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const { isInsideCampus } = require('../utils/campusBoundary');
const { toReportResponse } = require('../utils/reportMapper');
const { REPORTS_DIR } = require('../middlewares/upload');

// Milestone upvote yang memicu notifikasi (FR-A8 & Flutter isUpvoteMilestone)
function isMilestone(count) {
  return count === 5 || count === 10 || count === 25 || (count >= 50 && count % 50 === 0);
}

// Hapus file fisik dari disk jika merupakan file lokal di folder reports
async function removeLocalFile(mediaUrl) {
  if (!mediaUrl || /^https?:\/\//i.test(mediaUrl)) return;
  try {
    const filename = path.basename(mediaUrl);
    const filePath = path.join(REPORTS_DIR, filename);
    await fs.unlink(filePath);
  } catch {
    // Abaikan jika file tidak ditemukan
  }
}

// Validasi berkas media (maksimal 5, maksimal 1 video, foto <= 5MB, video <= 25MB)
function validateMediaFiles(files) {
  if (!files || files.length === 0) {
    throw AppError.mediaInvalid('Lampirkan minimal satu foto atau video sebagai bukti laporan');
  }
  if (files.length > 5) {
    throw AppError.mediaInvalid('Maksimal 5 media per laporan');
  }

  const videoCount = files.filter((f) => f.mimetype.toLowerCase().startsWith('video/')).length;
  if (videoCount > 1) {
    throw AppError.mediaInvalid('Hanya boleh maksimal 1 video per laporan');
  }

  for (const file of files) {
    const isVideo = file.mimetype.toLowerCase().startsWith('video/');
    if (!isVideo && file.size > 5 * 1024 * 1024) {
      throw AppError.mediaInvalid(`Ukuran foto "${file.originalname}" melebihi batas 5MB`);
    }
    if (isVideo && file.size > 25 * 1024 * 1024) {
      throw AppError.mediaInvalid(`Ukuran video "${file.originalname}" melebihi batas 25MB`);
    }
  }
}

/**
 * FR-A1: Membuat laporan baru dengan koordinat dalam kampus UNAND dan media valid.
 */
async function createReport(userId, data, files = []) {
  // 1. Validasi Geofencing Kampus UNAND
  const inside = isInsideCampus(data.latitude, data.longitude);
  if (!inside) {
    // Bersihkan file yang sempat terupload jika lokasi ditolak
    await Promise.all((files || []).map((f) => removeLocalFile(f.filename)));
    throw AppError.outsideCampus('Lokasi laporan berada di luar batas wilayah kampus UNAND');
  }

  // 2. Validasi Media
  try {
    validateMediaFiles(files);
  } catch (err) {
    await Promise.all((files || []).map((f) => removeLocalFile(f.filename)));
    throw err;
  }

  // 3. Simpan ke database via transaksi
  const created = await prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        userId,
        category: data.category,
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.location_name || null,
      },
    });

    const mediaRecords = files.map((file, idx) => ({
      reportId: report.id,
      mediaUrl: `reports/${file.filename}`,
      mediaType: file.mimetype.toLowerCase().startsWith('video/') ? 'video' : 'image',
      sortOrder: idx,
    }));

    await tx.reportMedia.createMany({
      data: mediaRecords,
    });

    // Catat log aktivitas (FR-24 / FR-C6)
    await tx.activityLog.create({
      data: {
        userId,
        actionType: 'buat_laporan',
        reportId: report.id,
        reportTitle: report.title,
      },
    });

    return tx.report.findUnique({
      where: { id: report.id },
      include: {
        user: true,
        media: true,
        upvotes: { where: { userId } },
        bookmarks: { where: { userId } },
      },
    });
  });

  return toReportResponse(created, userId);
}

/**
 * FR-A2: Mengubah laporan sendiri (maksimal 24 jam setelah dibuat).
 */
async function updateReport(userId, reportId, data, newFiles = []) {
  const existing = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      media: true,
      user: true,
    },
  });

  if (!existing) {
    await Promise.all((newFiles || []).map((f) => removeLocalFile(f.filename)));
    throw AppError.notFound('Laporan tidak ditemukan');
  }

  // Cek kepemilikan
  if (existing.userId !== userId) {
    await Promise.all((newFiles || []).map((f) => removeLocalFile(f.filename)));
    throw AppError.forbidden('Kamu hanya bisa mengubah laporan milikmu sendiri');
  }

  // Cek jendela waktu 24 jam
  const diffMs = Date.now() - new Date(existing.createdAt).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours > 24) {
    await Promise.all((newFiles || []).map((f) => removeLocalFile(f.filename)));
    throw AppError.editWindowExpired(
      'Batas waktu edit (24 jam) untuk laporan ini telah berakhir',
    );
  }

  // Validasi komposisi media yang dipertahankan + media baru
  const keptIds = new Set(data.kept_media_ids || []);
  const keptMedia = existing.media.filter((m) => keptIds.has(m.id));
  const removedMedia = existing.media.filter((m) => !keptIds.has(m.id));

  // Jika tidak mengirim kept_media_ids dan tidak upload file baru, pertahankan semua
  const isUpdatingMedia = (data.kept_media_ids && data.kept_media_ids.length > 0) || newFiles.length > 0;
  const finalMediaKept = isUpdatingMedia ? keptMedia : existing.media;
  const finalMediaToRemove = isUpdatingMedia ? removedMedia : [];

  const totalCount = finalMediaKept.length + newFiles.length;
  if (totalCount < 1) {
    await Promise.all(newFiles.map((f) => removeLocalFile(f.filename)));
    throw AppError.mediaInvalid('Laporan harus memiliki minimal satu foto atau video');
  }
  if (totalCount > 5) {
    await Promise.all(newFiles.map((f) => removeLocalFile(f.filename)));
    throw AppError.mediaInvalid('Maksimal 5 media per laporan');
  }

  const keptVideoCount = finalMediaKept.filter((m) => m.mediaType === 'video').length;
  const newVideoCount = newFiles.filter((f) => f.mimetype.toLowerCase().startsWith('video/')).length;
  if (keptVideoCount + newVideoCount > 1) {
    await Promise.all(newFiles.map((f) => removeLocalFile(f.filename)));
    throw AppError.mediaInvalid('Hanya boleh maksimal 1 video per laporan');
  }

  for (const file of newFiles) {
    const isVideo = file.mimetype.toLowerCase().startsWith('video/');
    if (!isVideo && file.size > 5 * 1024 * 1024) {
      await Promise.all(newFiles.map((f) => removeLocalFile(f.filename)));
      throw AppError.mediaInvalid(`Ukuran foto "${file.originalname}" melebihi batas 5MB`);
    }
    if (isVideo && file.size > 25 * 1024 * 1024) {
      await Promise.all(newFiles.map((f) => removeLocalFile(f.filename)));
      throw AppError.mediaInvalid(`Ukuran video "${file.originalname}" melebihi batas 25MB`);
    }
  }

  // Update dalam transaksi database
  const updated = await prisma.$transaction(async (tx) => {
    // 1. Hapus media yang dibuang
    if (finalMediaToRemove.length > 0) {
      const idsToRemove = finalMediaToRemove.map((m) => m.id);
      await tx.reportMedia.deleteMany({
        where: { id: { in: idsToRemove } },
      });
    }

    // 2. Tambahkan media baru dengan nomor urut berikutnya
    if (newFiles.length > 0) {
      let nextSortOrder = finalMediaKept.length;
      const newMediaRecords = newFiles.map((file) => ({
        reportId,
        mediaUrl: `reports/${file.filename}`,
        mediaType: file.mimetype.toLowerCase().startsWith('video/') ? 'video' : 'image',
        sortOrder: nextSortOrder++,
      }));
      await tx.reportMedia.createMany({
        data: newMediaRecords,
      });
    }

    // 3. Update report dengan editedAt = waktu sekarang
    const reportData = {
      editedAt: new Date(),
    };
    if (data.title) reportData.title = data.title;
    if (data.description) reportData.description = data.description;
    if (data.category) reportData.category = data.category;

    const res = await tx.report.update({
      where: { id: reportId },
      data: reportData,
      include: {
        user: true,
        media: true,
        upvotes: { where: { userId } },
        bookmarks: { where: { userId } },
      },
    });

    // 4. Catat log aktivitas (FR-24)
    await tx.activityLog.create({
      data: {
        userId,
        actionType: 'ubah_laporan',
        reportId: res.id,
        reportTitle: res.title,
      },
    });

    return res;
  });

  // Hapus berkas fisik yang dibuang dari harddisk
  await Promise.all(finalMediaToRemove.map((m) => removeLocalFile(m.mediaUrl)));

  return toReportResponse(updated, userId);
}

/**
 * FR-A3: Menghapus laporan sendiri secara permanen.
 */
async function deleteReport(userId, reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { media: true },
  });

  if (!report) {
    throw AppError.notFound('Laporan tidak ditemukan');
  }

  if (report.userId !== userId) {
    throw AppError.forbidden('Kamu hanya bisa menghapus laporan milikmu sendiri');
  }

  // Transaksi penghapusan
  await prisma.$transaction(async (tx) => {
    // Catat riwayat aktivitas hapus laporan
    await tx.activityLog.create({
      data: {
        userId,
        actionType: 'hapus_laporan',
        reportId: null,
        reportTitle: report.title,
      },
    });

    // Hapus laporan (media, upvotes, bookmarks terhapus secara cascade via prisma)
    await tx.report.delete({
      where: { id: reportId },
    });
  });

  // Hapus semua file media laporan dari penyimpanan lokal
  await Promise.all((report.media || []).map((m) => removeLocalFile(m.mediaUrl)));

  return { message: 'Laporan berhasil dihapus' };
}

/**
 * FR-A4: Mengambil detail laporan lengkap (untuk dilihat, diedit, atau dibagikan).
 */
async function getReportById(reportId, currentUserId = null) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      user: true,
      media: true,
      upvotes: currentUserId ? { where: { userId: currentUserId } } : false,
      bookmarks: currentUserId ? { where: { userId: currentUserId } } : false,
    },
  });

  if (!report) {
    throw AppError.notFound('Laporan tidak ditemukan');
  }

  return toReportResponse(report, currentUserId);
}

/**
 * Mengambil daftar feed laporan (dengan paginasi, pencarian, dan filter).
 */
async function getReports(query, currentUserId = null) {
  const { category, q, sort = 'terbaru', page = 1, limit = 10, user_id, username, bookmarked } = query;

  const where = {};

  if (category) {
    where.category = category;
  }

  if (user_id) {
    where.userId = user_id;
  }

  if (username) {
    where.user = { username };
  }

  if (bookmarked && currentUserId) {
    where.bookmarks = { some: { userId: currentUserId } };
  }

  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term } },
      { description: { contains: term } },
      { locationName: { contains: term } },
    ];
  }

  const orderBy = sort === 'terpopuler'
    ? [{ upvoteCount: 'desc' }, { createdAt: 'desc' }]
    : [{ createdAt: 'desc' }];

  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: true,
        media: true,
        upvotes: currentUserId ? { where: { userId: currentUserId } } : false,
        bookmarks: currentUserId ? { where: { userId: currentUserId } } : false,
      },
    }),
    prisma.report.count({ where }),
  ]);

  const items = reports.map((r) => toReportResponse(r, currentUserId));
  const hasMore = skip + reports.length < total;

  return { items, page, limit, total, has_more: hasMore };
}

/**
 * FR-A5 & FR-A8: Toggle Upvote (Memberi / Menarik Upvote + Notifikasi Milestone).
 */
async function toggleUpvote(userId, reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, userId: true, title: true, upvoteCount: true },
  });

  if (!report) {
    throw AppError.notFound('Laporan tidak ditemukan');
  }

  const existingVote = await prisma.upvote.findUnique({
    where: {
      userId_reportId: { userId, reportId },
    },
  });

  let isUpvoted = false;
  let newCount = report.upvoteCount;

  if (existingVote) {
    // Tarik upvote
    await prisma.$transaction([
      prisma.upvote.delete({
        where: { userId_reportId: { userId, reportId } },
      }),
      prisma.report.update({
        where: { id: reportId },
        data: {
          upvoteCount: {
            decrement: report.upvoteCount > 0 ? 1 : 0,
          },
        },
      }),
    ]);
    isUpvoted = false;
    newCount = Math.max(0, report.upvoteCount - 1);
  } else {
    // Beri upvote
    const [, updatedReport] = await prisma.$transaction([
      prisma.upvote.create({
        data: { userId, reportId },
      }),
      prisma.report.update({
        where: { id: reportId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);

    isUpvoted = true;
    newCount = updatedReport.upvoteCount;

    // FR-A8: Notifikasi Milestone Upvote (5, 10, 25, dan kelipatan 50)
    // Hanya dikirim jika pelapor adalah orang lain (bukan upvote diri sendiri)
    if (isMilestone(newCount) && report.userId !== userId) {
      const dedupeKey = `upvote_${report.id}_${newCount}`;
      try {
        await prisma.notification.upsert({
          where: { dedupeKey },
          update: {},
          create: {
            userId: report.userId,
            type: 'upvote_milestone',
            title: 'Laporan Mencapai Milestone Upvote!',
            body: `Laporan "${report.title}" telah mendapat ${newCount} upvote dari warga kampus.`,
            reportId: report.id,
            dedupeKey,
          },
        });
      } catch (err) {
        // Jangan gagalkan vote jika notifikasi gagal
        console.error('[Notification Error]', err);
      }
    }
  }

  return {
    is_upvoted: isUpvoted,
    upvote_count: newCount,
  };
}

/**
 * FR-A6: Toggle Bookmark (Menyimpan / Menghapus dari Koleksi Bookmark).
 */
async function toggleBookmark(userId, reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true },
  });

  if (!report) {
    throw AppError.notFound('Laporan tidak ditemukan');
  }

  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_reportId: { userId, reportId },
    },
  });

  let isBookmarked = false;
  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_reportId: { userId, reportId } },
    });
    isBookmarked = false;
  } else {
    await prisma.bookmark.create({
      data: { userId, reportId },
    });
    isBookmarked = true;
  }

  return { is_bookmarked: isBookmarked };
}

/**
 * FR-A7: Mengambil koleksi bookmark pengguna (untuk ditampilkan dalam grid di profil).
 */
async function getUserBookmarks(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        report: {
          include: {
            user: true,
            media: true,
            upvotes: { where: { userId } },
            bookmarks: { where: { userId } },
          },
        },
      },
    }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  const items = bookmarks
    .filter((b) => b.report != null)
    .map((b) => toReportResponse(b.report, userId));

  const hasMore = skip + bookmarks.length < total;

  return { items, page, limit, total, has_more: hasMore };
}

module.exports = {
  createReport,
  updateReport,
  deleteReport,
  getReportById,
  getReports,
  toggleUpvote,
  toggleBookmark,
  getUserBookmarks,
};
