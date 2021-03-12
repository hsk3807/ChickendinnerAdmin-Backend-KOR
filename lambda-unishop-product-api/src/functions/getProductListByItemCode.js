const { createResponse, httpStatus } = require('../utils/helpers')
const GeneralSchema = require('../schema/generalSchema')
const ProductSchema = require('../schema/productSchema')
const { validateInput } = require('../utils/validator')
const ProductService = require('../services/productService')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const multiValueQueryStringParameters = e.multiValueQueryStringParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { item_code } = multiValueQueryStringParameters
        const { error: errorItemCode, value: listOfItemCode } = validateInput(item_code, GeneralSchema.LIST_STRING)
        if (errorItemCode) return createResponse(httpStatus.badRequest, { message: errorItemCode.message })

        const {countryCode} = validatedPathParams
        
        const data = await ProductService.getListByItemCode( countryCode, { listOfItemCode })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}