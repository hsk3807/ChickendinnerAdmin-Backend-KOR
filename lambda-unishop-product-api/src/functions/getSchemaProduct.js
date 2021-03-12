const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const ProductSchema = require('../schema/productSchema')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode: country_code } = validatedPathParams
        const data = await ProductSchema.NEW.validate({ 
            country_code, 
            warehouse: "", 
            item_code : "" 
        })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}