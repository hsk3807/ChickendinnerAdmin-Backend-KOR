const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const BannerSchema = require("../schema/bannerSchema")
const BannerService = require("../services/bannerService")

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, BannerSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { error: errorGetSchema, data } = await BannerService.getSchema(validatedPathParams)
        if (errorGetSchema) return createResponse(errorGetSchema.httpStatus, { message: errorGetSchema.message })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}