const GeneralSchema = require("../schema/generalSchema")
const { validateInput } = require('../utils/validator')
const { createResponse, httpStatus } = require("../utils/helpers")
const PosService = require("../services/posService")

const getLinks = async e => {
    try {
        const { countryCode } = e.pathParameters || {}

        const { error: errorValidateParams, value: countryCodeValid } = validateInput(countryCode, GeneralSchema.VALID_COUNTRY)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const items = await PosService.getLinks(countryCodeValid)
        const data = { items }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, {
            message: err.message,
        })
    }
}

module.exports = {
    getLinks,
}
