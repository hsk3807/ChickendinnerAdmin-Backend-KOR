const FooterService = require('../services/footerService')
const { createResponse, httpStatus, provideEmptyStringDisplay } = require('../utils/helpers')
const { removeUShopUrl } = require("../utils/converterHelper")

module.exports.handler = async e => {
    try {
        const { country_code } = e.pathParameters || {}
        const { isOrigin = false } = e.queryStringParameters || {}

        if (!!!country_code) {
            return createResponse(httpStatus.badRequest, { message: `country_code require!` })
        }

        let footer = await FooterService.getFooterByCountryCodeAdmin(country_code.toUpperCase())

        provideEmptyStringDisplay(footer)
        // if (!isOrigin) removeUShopUrl(country_code.toUpperCase(), footer)

        const data = footer

        return createResponse(httpStatus.created, { data })
    } catch (err) {
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}

module.exports.handlerUser = async e => {
    try {
        const { country_code } = e.pathParameters || {}
        const { isOrigin = false } = e.queryStringParameters || {}

        if (!!!country_code) {
            return createResponse(httpStatus.badRequest, { message: `country_code require!` })
        }

        let footer = await FooterService.getFooterByCountryCodeUser(country_code.toUpperCase())

        provideEmptyStringDisplay(footer)
        // if (!isOrigin) removeUShopUrl(country_code.toUpperCase(), footer)

        const data = footer

        return createResponse(httpStatus.created, { data })
    } catch (err) {
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}