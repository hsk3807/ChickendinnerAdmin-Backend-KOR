const httpStatus = {
  ok: 200,
  created: 201,
  noContent: 204,
  badRequest: 400,
  Unauthorized: 401,
  notFound: 404,
  Conflict: 409,
  InternalServerError: 500,
};

const parseBodyJSON = (body) =>
  typeof body === 'object' ? body : JSON.parse(body || '{}');

const createResponse = (statusCode, { data, message, error }) => {
  const body = message || error ? { message, error } : data;
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
};

const createServiceError = (httpStatus, message) => ({
  error: {
    httpStatus,
    message,
  },
});

module.exports = {
  httpStatus,
  parseBodyJSON,
  createResponse,
  createServiceError,
};
