const jwt = require('jsonwebtoken')

const {
    parseBodyJSON,
    createResponse,
    httpStatus,
    compressPermissions,
    generateToken,
} = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const UserSchema = require("../schema/userSchema")
const UserService = require("../services/UserService")
const UserRoles = require('../helpers/userRoles')

module.exports.handler = async e => {
    try {
        const body = parseBodyJSON(e.body)

        const { error: errorValidate, value: validatedBody } = validateInput(body, UserSchema.LOGIN)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { error: errorLogin, data: loginData } = await UserService.login(validatedBody)
        if (errorLogin) return createResponse(errorLogin.httpStatus, { message: errorLogin.message })

        const { username, country } = loginData
        let permissions

        if (["Patchamet"].includes(username)) {
            permissions = UserRoles.getTest([country])
        } else if (['PHL', 'JPN'].includes(country)) {
            permissions = UserRoles.getRolesBannerOnly([country])
        } else {
            permissions = UserRoles.getAll()
        }

        const ushopToken = generateToken({ username, permissions: compressPermissions(permissions) })

        const data = { ...loginData, ushopToken }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}