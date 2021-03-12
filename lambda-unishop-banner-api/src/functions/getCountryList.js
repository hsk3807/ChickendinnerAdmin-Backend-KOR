const { createResponse, httpStatus } = require('../utils/helpers')
const CountryService = require("../services/countryService")

module.exports.handler = async e => {
    try {
        const { error: errorGetList, data } = await CountryService.getList()
        if (errorGetList) return createResponse(errorGetList.httpStatus, { message: errorGetList.message })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}