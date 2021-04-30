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
const Helpers = require('../utils/helpers');

module.exports.handler = async (e) => {
  try {
    const { user } = e.queryStringParameters || {};

    let params = e.queryStringParameters;

    const data = await UserService.createSocial(params);

    return data
      ? createResponse(httpStatus.ok, {
          data: 'success',
        })
      : createResponse(httpStatus.ok, {
          data: 'failed',
        });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message || err,
    });
  }
};
