const AppError = require('../utils/AppError');

/**
 * Validasi request dengan zod.
 *
 *   router.post('/register', validate({ body: registerSchema }), controller.register);
 *   router.get('/reports', validate({ query: listSchema }), controller.list);
 *
 * Hasil yang sudah dibersihkan/di-transform ada di req.validated.{body,query,params}.
 * req.body juga diganti dengan hasil validasi. req.query & req.params TIDAK diganti
 * karena di Express 5 req.query hanya getter (tidak bisa di-assign).
 */
function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const details = [];

    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({
            field: issue.path.join('.') || part,
            message: issue.message,
          });
        }
      }
    }

    if (details.length > 0) {
      return next(AppError.validation(details, details[0].message));
    }

    req.validated = validated;
    if (validated.body) req.body = validated.body;
    next();
  };
}

module.exports = validate;
