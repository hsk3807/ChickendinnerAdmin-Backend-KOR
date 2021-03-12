const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const ProductService = require("../services/productService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.PATH_PARAMS_PRODUCT)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        // Check Auth
        const { countryCode: countryCodePath, id: idPath } = validatedPathParams
        const { isAllow } = PermissionHelpers.checkAllow(e, countryCodePath, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Remove
        const { affectedRows } = await ProductService.removeById(idPath)
        return affectedRows ? createResponse(httpStatus.ok, { data: validatedPathParams }) : createResponse(httpStatus.notFound, { message: 'Not found.' })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}