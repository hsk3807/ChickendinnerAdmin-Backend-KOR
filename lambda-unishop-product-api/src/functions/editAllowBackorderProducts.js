const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const ProductSchema = require('../schema/productSchema')
const ProductService = require("../services/productService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')


module.exports.handler = async e => {
    try {
        // Validate pathParameters
        const pathParams = e.pathParameters || {}
        const { error: errorValidatePathParams, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidatePathParams) return createResponse(httpStatus.badRequest, { message: errorValidatePathParams.message })

        // Validate body
        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, ProductSchema.EDIT_MULTI_ALLOW_BACKORDER)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Check Auth
        const { countryCode: countryCodePath } = validatedPathParams
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCodePath, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })
        // // Update data
        // Update data
        const { username } = decodedData
        const updated_by = username
        const updated_on = new Date().toISOString().replace("T", " ").substring(0, 22)
        const listOfEditData = validatedBody.map(r => ({ ...r, updated_by, updated_on }))
        const data = await ProductService.updateMultiple(listOfEditData)

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}