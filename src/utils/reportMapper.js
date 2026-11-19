const { toPublicUrl } = require('./publicUrl');

function getInitials(name) {
  if (!name) return 'U';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'U';
}

function formatRelativeTime(date) {
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}j lalu`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 30) return `${diffDays}h lalu`;
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/**
 * Memetakan record Report dari Prisma ke bentuk JSON respons yang konsisten dengan Flutter.
 *
 * @param {object} report - Objek report dari Prisma (termasuk relasi `user` & `media`)
 * @param {string|null} currentUserId - ID user yang sedang login (untuk status upvote/bookmark)
 */
function toReportResponse(report, currentUserId = null) {
  const isUpvoted = currentUserId && Array.isArray(report.upvotes)
    ? report.upvotes.some((u) => u.userId === currentUserId)
    : false;

  const isBookmarked = currentUserId && Array.isArray(report.bookmarks)
    ? report.bookmarks.some((b) => b.userId === currentUserId)
    : false;

  const isCondition = report.category === 'kondisi_kampus';
  const badgeLabel = isCondition ? 'Kondisi Kampus' : 'Informasi Penting';
  const badgeVariant = isCondition ? 'dot' : 'icon';

  const mediaList = Array.isArray(report.media)
    ? report.media
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((m) => ({
          id: m.id,
          url: toPublicUrl(m.mediaUrl),
          type: m.mediaType,
          sort_order: m.sortOrder,
        }))
    : [];

  const mediaUrls = mediaList.map((m) => m.url);
  const imageUrl = mediaUrls.length > 0 ? mediaUrls[0] : null;

  const latNum = report.latitude != null ? Number(report.latitude) : null;
  const lngNum = report.longitude != null ? Number(report.longitude) : null;
  const locationDetail = latNum != null && lngNum != null
    ? `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`
    : null;

  const timeDisplay = formatRelativeTime(report.createdAt);
  const locName = report.locationName || 'Kampus UNAND';
  const metaText = `${locName} • ${timeDisplay}`;

  const authorName = report.user?.nama || 'Warga Kampus';
  const authorUsername = report.user?.username || null;
  const authorAvatarUrl = toPublicUrl(report.user?.fotoProfil);

  return {
    id: report.id,
    card_type: 'report',
    user_id: report.userId,
    author_name: authorName,
    author_username: authorUsername,
    author_initials: getInitials(authorName),
    author_avatar_url: authorAvatarUrl,
    badge_label: badgeLabel,
    badge_variant: badgeVariant,
    category: report.category,
    title: report.title,
    description: report.description,
    latitude: latNum,
    longitude: lngNum,
    location_name: report.locationName,
    location_detail: locationDetail,
    meta_text: metaText,
    media: mediaList,
    media_urls: mediaUrls,
    image_url: imageUrl,
    upvote_count: report.upvoteCount || 0,
    is_upvoted: Boolean(isUpvoted),
    is_bookmarked: Boolean(isBookmarked),
    created_at: report.createdAt ? new Date(report.createdAt).toISOString() : null,
    edited_at: report.editedAt ? new Date(report.editedAt).toISOString() : null,
  };
}

module.exports = { toReportResponse, getInitials };
