const {
    createResponse,
    httpStatus,
    extractFilter,
    extractNotFilter,
    extractBetweenFilter
} = require('../utils/helpers')
const GeneralSchema = require('../schema/generalSchema')
const { validateInput } = require('../utils/validator')
const PaymentService = require('../services/paymentService')

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

module.exports.handler = async e => {
    try {
        const {
            pathParameters,
            multiValueQueryStringParameters,
            queryStringParameters,
        } = e

        const { error: errorValidate, value: validatedPathParameters } = validateInput(pathParameters, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParameters
        const filter = extractFilter(multiValueQueryStringParameters || {})
        const notFilter = extractNotFilter(multiValueQueryStringParameters || {})
        const between = extractBetweenFilter(queryStringParameters || {})
        let { skip, limit, keyword } = queryStringParameters || {}

        if (!skip) skip = 0
        if (!limit) limit = 100

        const total = await PaymentService.getCount(countryCode, { filter, notFilter, between, keyword })
        const list = await PaymentService.getList(countryCode, { filter, notFilter, between, skip, limit, keyword })

        const data = {
            list,
            total,
            filter,
            notFilter,
            between,
            ...(!skip ? {} : { skip: isNaN(skip) ? 0 : parseInt(skip) }),
            ...(!limit ? {} : { limit: isNaN(limit) ? 0 : parseInt(limit) }),
        }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        const { sql, ...otherError } = err
        return createResponse(httpStatus.InternalServerError, { message: otherError })
    }
}