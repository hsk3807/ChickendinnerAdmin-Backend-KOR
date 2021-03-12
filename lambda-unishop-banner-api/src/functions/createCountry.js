const { parseBodyJSON, createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const CountrySchema = require("../schema/countrySchema")
const CountryService = require("../services/countryService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {        
        const body = parseBodyJSON(e.body)
        const { error: errorValidate, value: validatedBody } = validateInput(body, CountrySchema.CREATE_NEW)
        if (errorValidate) return createResponse(errorValidate.httpStatus, { message: errorValidate.message })

        const { countryCode } = validatedBody || {}
        const { isAllow } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const data = validatedBody
        const { error: errorCreate } = await CountryService.create(data)
        if (errorCreate) return createResponse(errorCreate.httpStatus, { message: errorCreate.message })

        return createResponse(httpStatus.created, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}