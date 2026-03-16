const { isV1Request, sendV1Error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  // Skip logging for benign client disconnect errors
  // These occur when users navigate away, close browser, or network drops
  const isClientDisconnect = err.message === 'aborted' ||
                              err.code === 'ECONNRESET' ||
                              err.code === 'EPIPE' ||
                              err.code === 'ECONNABORTED';

  if (!isClientDisconnect) {
    console.error(err.stack);
  }

  // If client disconnected, no point sending response
  if (isClientDisconnect) {
    return;
  }

  if (isV1Request(req)) {
    if (err.name === 'MulterError') {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large'
        : err.message;
      return sendV1Error(res, 400, 'BAD_REQUEST', message);
    }

    if (err.status) {
      return sendV1Error(res, err.status, err.status === 409 ? 'CONFLICT' : 'BAD_REQUEST', err.message);
    }

    if (err.name === 'ValidationError') {
      return sendV1Error(res, 400, 'VALIDATION_ERROR', err.message);
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
      return sendV1Error(res, 401, 'UNAUTHORIZED', 'Invalid token');
    }

    if (err.code === '23505') {
      const message = err.constraint === 'trades_duplicate_signature_idx'
        ? 'Duplicate trade detected. This trade already exists.'
        : 'Resource already exists';
      return sendV1Error(res, 409, 'CONFLICT', message);
    }

    if (err.code === '23503') {
      return sendV1Error(res, 400, 'BAD_REQUEST', 'Invalid reference');
    }

    return sendV1Error(
      res,
      500,
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    );
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large'
        : err.message
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }

  if (err.status) {
    return res.status(err.status).json({
      error: err.status === 409 ? 'Conflict' : 'Bad Request',
      message: err.message
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Conflict',
      message: err.constraint === 'trades_duplicate_signature_idx'
        ? 'Duplicate trade detected. This trade already exists.'
        : 'Resource already exists'
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid reference'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
