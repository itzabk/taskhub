import createError from 'create-error';

export const AppError = createError('AppError', {
  statusCode: 500,
});

export const BadRequestError = createError('BadRequestError', AppError, {
  statusCode: 400,
});

export const UnauthorizedError = createError('UnauthorizedError', AppError, {
  statusCode: 401,
});

export const NotFoundError = createError('NotFoundError', AppError, {
  statusCode: 404,
});

export const ConflictError = createError('ConflictError', AppError, {
  statusCode: 409,
});

export const ValidationError = createError('ValidationError', BadRequestError);

export const createAppError = (message, statusCode = 500, details = {}) => {
  const error = new AppError(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};
