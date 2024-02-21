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

module.exports = {
  BadRequestError,
  UnauthorizedError,
};
