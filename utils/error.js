function errorWithStatus(message, status) {
  const error = new Error(message);
  error.status = status;

  return error;
}

function BadRequestError(message) {
  return errorWithStatus(message, 400);
}

function UnauthorizedError(message) {
  return errorWithStatus(message, 401);
}

function buildErrorHandlerData(err) {
  const { message, status = 500 } = err;
  const description = status >= 500 ? "Something unexpected happened" : message;
  const details = process.env.NODE_ENV !== "production" ? err.stack : "";

  return {
    status,
    description,
    details,
  };
}

module.exports = {
  BadRequestError,
  UnauthorizedError,
  buildErrorHandlerData,
};
