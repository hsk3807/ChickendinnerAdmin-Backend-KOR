// const jwt = require('jsonwebtoken')
const {
  createResponse,
  httpStatus,
  parseBodyJSON,
} = require('../utils/helpers');
// const UserSchema = require('../schema/userSchema')
// const { validateInput } = require('../utils/validator')
// const UserService = require('../services/UserService')

module.exports.handler = async (e) => {
  try {
    return createResponse(httpStatus.ok, { 'test : ': 'test' });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message || err,
    });
  }
};
