const { parseBodyJSON, createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const BannerSchema = require("../schema/bannerSchema")
const BannerService = require("../services/bannerService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const { error: errorValidateParams, value: validatedPathParams } = validateInput(pathParams, BannerSchema.SPECIFIC)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validateBody } = validateInput(body, BannerSchema.EDIT_ACTIVE)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const { countryCode } = validatedPathParams        
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const updatedAt = new Date().toISOString()
        const { username: updatedBy } = decodedData
        const data = {
            updatedAt,
            updatedBy,
            ...validatedPathParams,
            ...validateBody,
        }
        const { error: errorInsert } = await BannerService.update(data)
        if (errorInsert) return createResponse(errorInsert.httpStatus, { message: errorInsert.message })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}