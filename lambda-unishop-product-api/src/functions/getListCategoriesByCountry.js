const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require("../utils/validator")
const CategoryService = require('../services/categoryService')
const GeneralSchema = require('../schema/generalSchema')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const multiValueQueryStringParameters = e.multiValueQueryStringParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams
        const data = await CategoryService.getList(countryCode, multiValueQueryStringParameters)
        
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}