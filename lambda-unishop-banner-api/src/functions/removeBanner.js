const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const BannerSchema = require("../schema/bannerSchema")
const BannerService = require("../services/bannerService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, BannerSchema.REMOVE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams || {}
        const { isAllow } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const data = validatedPathParams
        const { error: errorDelete } = await BannerService.remove(data)
        if (errorDelete) return createResponse(errorDelete.httpStatus, { message: errorDelete.message })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}