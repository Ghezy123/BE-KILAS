/**
 * Error yang sengaja dilempar dari service/controller.
 * errorHandler mengubahnya menjadi respons { success: false, error: {...} }.
 *
 * message tampil langsung di snackbar aplikasi, jadi tulis dalam
 * Bahasa Indonesia yang ramah pengguna.
 */
class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static unauthenticated(message = 'Silakan masuk terlebih dahulu') {
    return new AppError(401, 'UNAUTHENTICATED', message);
  }

  static tokenInvalid(message = 'Sesi berakhir, silakan masuk kembali') {
    return new AppError(401, 'TOKEN_INVALID', message);
  }

  static invalidCredentials(message = 'Email atau password salah') {
    return new AppError(401, 'INVALID_CREDENTIALS', message);
  }

  static forbidden(message = 'Kamu tidak memiliki akses untuk tindakan ini') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static editWindowExpired(message = 'Laporan hanya bisa diubah dalam 24 jam setelah dibuat') {
    return new AppError(403, 'EDIT_WINDOW_EXPIRED', message);
  }

  static notFound(message = 'Data tidak ditemukan') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static duplicate(message = 'Data sudah terdaftar') {
    return new AppError(409, 'DUPLICATE', message);
  }

  static validation(details, message = 'Data yang dikirim tidak valid') {
    return new AppError(422, 'VALIDATION_ERROR', message, details);
  }

  static mediaInvalid(message = 'Media tidak valid') {
    return new AppError(422, 'MEDIA_INVALID', message);
  }

  static outsideCampus(message = 'Lokasi berada di luar area kampus UNAND') {
    return new AppError(422, 'OUTSIDE_CAMPUS', message);
  }
}

module.exports = AppError;
