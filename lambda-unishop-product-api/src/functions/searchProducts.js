const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require('../schema/generalSchema')
const ProductService = require('../services/productService')


module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams
        let { s: skip, l: limit, } = e.queryStringParameters || {}
        const { k: keywords = [] } = e.multiValueQueryStringParameters || {}

        skip = isNaN(parseInt(skip)) ? 0 : parseInt(skip)
        limit = isNaN(parseInt(limit)) ? 10 : parseInt(limit)

        let data = []
        if (keywords.length > 0){
            data = await ProductService.search(countryCode, keywords, skip, limit)
        }
    
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}