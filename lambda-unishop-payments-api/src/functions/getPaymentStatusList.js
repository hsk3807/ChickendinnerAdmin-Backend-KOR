const { createResponse, httpStatus } = require('../utils/helpers')
const GeneralSchema = require('../schema/generalSchema')
const { validateInput } = require('../utils/validator')
const PaymentService = require('../services/paymentService')

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

module.exports.handler = async e => {
    try {
        const { pathParameters } = e

        const { error: errorValidate, value: validatedPathParameters } = validateInput(pathParameters, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParameters
        const data = await PaymentService.getPaymentStatusList(countryCode)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        const { sql, ...otherError } = err
        return createResponse(httpStatus.InternalServerError, { message: otherError })
    }
}