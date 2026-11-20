const reportService = require('../services/report.service');
const { ok, created } = require('../utils/apiResponse');

async function createReport(req, res, next) {
  try {
    const data = req.validated?.body || req.body;
    const report = await reportService.createReport(req.userId, data, req.files);
    return created(res, report);
  } catch (err) {
    return next(err);
  }
}

async function updateReport(req, res, next) {
  try {
    const data = req.validated?.body || req.body;
    const report = await reportService.updateReport(req.userId, req.params.id, data);
    return ok(res, report);
  } catch (err) {
    return next(err);
  }
}

async function deleteReport(req, res, next) {
  try {
    const result = await reportService.deleteReport(req.userId, req.params.id);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getReportById(req, res, next) {
  try {
    const report = await reportService.getReportById(req.params.id, req.userId);
    return ok(res, report);
  } catch (err) {
    return next(err);
  }
}

async function getReports(req, res, next) {
  try {
    const query = req.validated?.query || req.query;
    const result = await reportService.getReports(query, req.userId);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function toggleUpvote(req, res, next) {
  try {
    const result = await reportService.toggleUpvote(req.userId, req.params.id);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function toggleBookmark(req, res, next) {
  try {
    const result = await reportService.toggleBookmark(req.userId, req.params.id);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getUserBookmarks(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await reportService.getUserBookmarks(req.userId, page, limit);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
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
