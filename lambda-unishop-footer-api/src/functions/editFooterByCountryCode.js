const FooterService = require('../services/footerService')
// const Validator = require("../utils/validator")
const {
    createResponse,
    httpStatus,
    provideEmptyStringStore,
    provideEmptyStringDisplay,
} = require('../utils/helpers')
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {
        const { country_code: countryCodeParam } = e.pathParameters || {}
        const countryCode = countryCodeParam && countryCodeParam.toUpperCase()

        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        if (!!!countryCode) return createResponse(httpStatus.badRequest, { message: `countryCode require!` })

        const { username: updateBy } = decodedData
        const updateTime = new Date().toISOString()
        const editFooter = { ...JSON.parse(e.body), updateBy, updateTime }

        provideEmptyStringStore(editFooter)
        await FooterService.editFooterByCountryCode(editFooter)
        provideEmptyStringDisplay(editFooter)
        return createResponse(httpStatus.ok, { data: editFooter })

    } catch (err) {
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}