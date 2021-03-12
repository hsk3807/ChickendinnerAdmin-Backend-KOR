const { createResponse, httpStatus } = require('../utils/helpers')
const GeneralSchema = require('../schema/generalSchema')
const { validateInput } = require('../utils/validator')
const WarehouseService = require('../services/warehouseService')

module.exports.handler = async e => {
    try {
        const multiValueQueryStringParameters = e.multiValueQueryStringParameters || {}

        const data = await WarehouseService.getDataList(multiValueQueryStringParameters)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}