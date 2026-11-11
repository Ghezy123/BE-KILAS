/**
 * Format respons sukses standar (KONTEKS_BACKEND §6.1).
 *
 *   ok(res, data)                      -> 200 { success: true, data }
 *   created(res, data)                 -> 201 { success: true, data }
 *   noContent(res)                     -> 204 (tanpa body)
 *   paginated(res, items, page, limit, hasMore)
 *                                      -> 200 { success: true, data: { items, page, limit, has_more } }
 */
function ok(res, data = null, status = 200) {
  return res.status(status).json({ success: true, data });
}

function created(res, data = null) {
  return ok(res, data, 201);
}

function noContent(res) {
  return res.status(204).end();
}

function paginated(res, items, page, limit, hasMore) {
  return ok(res, { items, page, limit, has_more: hasMore });
}

module.exports = { ok, created, noContent, paginated };
