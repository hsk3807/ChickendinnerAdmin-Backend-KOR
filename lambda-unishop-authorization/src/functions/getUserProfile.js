const jwt = require('jsonwebtoken')
const { createResponse, httpStatus } = require('../utils/helpers')
const UserService = require("../services/UserService")

module.exports.handler = async e => {
    try {
        // Check Token
        const { Authorization: token } = e.headers
        const tokenData = jwt.decode(token)
        const { username } = tokenData

        const data = await UserService.getUserProfile(username)
      
        return data ? createResponse(httpStatus.ok, { data }) : createResponse(httpStatus.notFound, { message : 'Not found.' })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}