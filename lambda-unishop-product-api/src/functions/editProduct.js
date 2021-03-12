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
        const { error: errorValidatePathParams, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.PATH_PARAMS_PRODUCT)
        if (errorValidatePathParams) return createResponse(httpStatus.badRequest, { message: errorValidatePathParams.message })

        // Validate body
        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, ProductSchema.EDIT)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Check Auth
        const { countryCode: countryCodePath, id: idPath } = validatedPathParams
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCodePath, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Matching data with params
        const { 
            country_code, 
            id,
            link_list: link_listRaw,
            link_list2: link_list2Raw,
        } = validatedBody
        const isMatch = (countryCodePath === country_code) && (idPath.toString() === id.toString())
        if (!isMatch) return createResponse(httpStatus.badRequest, { message: `id not match` })

        // Update data
        const link_list = Array.isArray(link_listRaw) ? JSON.stringify(link_listRaw) : "[]"
        const link_list2 = Array.isArray(link_list2Raw) ? JSON.stringify(link_list2Raw) : "[]"
        const { username } = decodedData
        const updated_by = username
        const updated_on = new Date().toISOString().replace("T", " ").substring(0, 22)
        const editData = { 
            ...validatedBody,
            link_list,
            link_list2,
            updated_by, 
            updated_on,
        }
        const { changedRows } = await ProductService.update(editData)
        const data = changedRows && await ProductService.getById(country_code, id)

        return changedRows ? createResponse(httpStatus.ok, { data }) : createResponse(httpStatus.notFound, { message: 'Not found.' })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}