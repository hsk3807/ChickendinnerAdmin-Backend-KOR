const FooterService = require('../services/footerService')
const { createResponse, httpStatus } = require('../utils/helpers')

module.exports.handler = async e => {
    try {
        const data = await FooterService.getCountryCodeList()
        return createResponse(httpStatus.created, { data })
    } catch (err) {
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}