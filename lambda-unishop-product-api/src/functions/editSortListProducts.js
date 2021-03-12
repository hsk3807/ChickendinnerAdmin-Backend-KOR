const deepEqual = require('fast-deep-equal')
const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const GeneralSchema = require('../schema/generalSchema')
const ProductSchema = require('../schema/productSchema')
const { validateInput } = require('../utils/validator')
const ProductService = require('../services/productService')

const reOrderSorted = dt => {
    const sortedList = dt.map(r => r.sorted).sort()
    const reSorted = dt.map((r, index) => ({ ...r, sorted: sortedList[index] }))
    return reSorted
}

const findProductFromSource = (ds, country_code, warehouse, item_code) => ds
    .find(r => r.country_code === country_code && r.warehouse === warehouse && r.item_code === item_code)

const assignNewNumber = (dbData, assignObj) => {
    const result = Object.keys(assignObj).reduce((obj, groupKey) => {
        const dataWithSorted = assignObj[groupKey].map(r => {
            const { country_code, warehouse, item_code } = r
            const foundProduct = findProductFromSource(dbData, country_code, warehouse, item_code)
            const { sorted } = foundProduct || {}
            return { ...r, sorted }
        })
        const reSortedData = reOrderSorted(dataWithSorted)
        obj = { ...obj, [groupKey]: reSortedData }

        return obj
    }, {})

    return result
}

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        //Check Country Code
        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE_WITH_WAREHOUSE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        // Validate body
        const body = parseBodyJSON(e.body)
        const dynamicSchema = ProductSchema.getEditSortListSchemaByBody(body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, dynamicSchema)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Prepare Data
        const { countryCode, warehouse } = validatedPathParams
        const dbData = await ProductService.getSortListByWarehouse(countryCode, warehouse)
        const dbReNumberData = dbData.map((r, index) => ({ ...r, sorted: `${100000 + index}` }))
        const reNumberData = assignNewNumber(dbReNumberData, validatedBody)
        const reSortedData = Object.keys(reNumberData).reduce((list, groupKey)=>[...list, ...reNumberData[groupKey]], [])
       
        // Save Data
        await ProductService.updateSortList(reSortedData)
        
        const data = reSortedData
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}