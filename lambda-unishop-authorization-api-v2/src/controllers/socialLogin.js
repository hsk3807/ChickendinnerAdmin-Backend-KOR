// const jwt = require('jsonwebtoken')
const {
  createResponse,
  httpStatus,
  parseBodyJSON,
} = require('../utils/helpers');
const PermissionHelpers = require('../utils/permissionHelpers');
// const UserSchema = require('../schema/userSchema')
// const { validateInput } = require('../utils/validator')
// const UserService = require('../services/UserService')
const UserService = require('../services/UserService');

module.exports.handler = async (e) => {
  try {
    const { socialId } = e.queryStringParameters || {};
    const data = await UserService.getBySocialId(socialId);

    return data
      ? createResponse(httpStatus.ok, {
          data: { user: data.user },
        })
      : createResponse(httpStatus.ok, {
          data: { user: null },
        });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message || err,
    });
  }
};
