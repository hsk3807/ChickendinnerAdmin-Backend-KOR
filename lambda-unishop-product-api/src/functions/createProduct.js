const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const ProductSchema = require('../schema/productSchema')
const ProductService = require("../services/productService")
const CategoryService = require("../services/categoryService")
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
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, ProductSchema.NEW)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Check Auth
        const { countryCode: countryCodePath } = validatedPathParams
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCodePath, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Matching data with params
        const { 
            country_code, 
            warehouse, 
            category_name_1, 
            item_code,
            link_list: link_listRaw,
            link_list2: link_list2Raw,
        } = validatedBody
        const isMatch = (countryCodePath === country_code)
        if (!isMatch) return createResponse(httpStatus.badRequest, { message: `country_code not match` })

        // Create data
        const { username } = decodedData
        const updated_by = username
        const updated_on = new Date().toISOString().replace("T", " ").substring(0, 22)

        const last_sorted = await ProductService.getLastSortedByCategory(country_code, warehouse, category_name_1)
        const sorted = last_sorted ? ("000000000000" + (last_sorted + 1)).slice(-3) : '001'
        const isNewItemOfCategory = !last_sorted ? true : false

        const last_category_sorted = await CategoryService.getLastCategorySortedByWarehouse(country_code, warehouse)
        const category_sorted = last_category_sorted
            ? (isNewItemOfCategory ? last_category_sorted + 1 : last_category_sorted).toString()
            : '100'

        const link_list = Array.isArray(link_listRaw) ? JSON.stringify(link_listRaw) : "[]"
        const link_list2 = Array.isArray(link_list2Raw) ? JSON.stringify(link_list2Raw) : "[]"

        const newData = { 
            ...validatedBody, 
            updated_by, 
            updated_on, 
            category_sorted, 
            sorted,
            link_list,
            link_list2,
        }
        await ProductService.create(newData)

        const data = await ProductService.getByItemCode(country_code, warehouse, item_code)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}