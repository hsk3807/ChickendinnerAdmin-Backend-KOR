const { createResponse, httpStatus } = require('../utils/helpers')
const GeneralSchema = require('../schema/generalSchema')
const { validateInput } = require('../utils/validator')
const CategoryService = require('../services/categoryService')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const multiValueQueryStringParameters = e.multiValueQueryStringParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams
        const data = await CategoryService.getSortList(countryCode, multiValueQueryStringParameters)

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}