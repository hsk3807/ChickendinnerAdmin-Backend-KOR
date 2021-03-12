const deepEqual = require('fast-deep-equal')
const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const GeneralSchema = require('../schema/generalSchema')
const CategorySchema = require('../schema/categorySchema')
const { validateInput } = require('../utils/validator')
const CategoryService = require('../services/categoryService')

const reSort = data => data.sort((r1, r2) => {
    const { country_code: country_code_r1, warehouse: warehouse_r1, category_name_1: category_name_1_r1 } = r1
    const { country_code: country_code_r2, warehouse: warehouse_r2, category_name_1: category_name_1_r2 } = r2
    return (country_code_r1 === country_code_r2)
        ? (warehouse_r1 === warehouse_r2)
            ? (category_name_1_r1 === category_name_1_r2)
                ? 0
                : category_name_1_r1 > category_name_1_r2 ? 1 : -1
            : warehouse_r1 > warehouse_r2 ? 1 : -1
        : country_code_r1 > country_code_r2 ? 1 : -1
})

const checkMatchingData = (data1, data2) => {
    const sortedData1 = reSort(JSON.parse(JSON.stringify(data1)))
    const sortedData2 = reSort(JSON.parse(JSON.stringify(data2)))
    return deepEqual(sortedData1, sortedData2)
}

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        //Check Country Code
        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        // Validate body
        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, CategorySchema.EDIT_SORT_LIST_CATEGORIES)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Check Country
        const { countryCode } = validatedPathParams || {}
        const otherCountryRows = validatedBody.filter(r => r.country_code !== countryCode)
        if (otherCountryRows.length > 0) return createResponse(httpStatus.Conflict, { message: 'Country Conflict.' })

        // Check Items Matching
        const warehouse = validatedBody.reduce((list, r) => list.includes(r.warehouse) ? list : [...list, r.warehouse], [])
        const sortList = await CategoryService.getSortList(countryCode, { warehouse })
        const oldData = sortList.map(r => ({ ...r }))
        const newData = validatedBody
        const isMatched = checkMatchingData(oldData, newData)
        if (!isMatched) return createResponse(httpStatus.Conflict, { message: 'Data has been changed.' })

        // Save Data
        const updateDatasource = newData.map((r, index) => ({ ...r, category_sorted: `${100 + index + 1}` }))
        await CategoryService.updateSortList(updateDatasource)

        const data = updateDatasource
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}