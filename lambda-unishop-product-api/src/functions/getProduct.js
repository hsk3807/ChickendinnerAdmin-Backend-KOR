const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const ProductService = require("../services/productService")

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.PATH_PARAMS_PRODUCT)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode, id } = validatedPathParams
        const data = await ProductService.getById(countryCode, id)
      
        return data ? createResponse(httpStatus.ok, { data }) : createResponse(httpStatus.notFound, { message : 'Not found.' })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}