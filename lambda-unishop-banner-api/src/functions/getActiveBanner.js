const { createResponse, httpStatus } = require('../utils/helpers')
const { getRemoveUshopUrl, removeUShopUrl } = require("../utils/converterHelper")
const { validateInput } = require('../utils/validator')
const BannerSchema = require("../schema/bannerSchema")
const BannerService = require("../services/bannerService")

const checkAvalibleDate = (beginDate, endDate, currentDate) => {
    if (beginDate && endDate) {
        if (currentDate < beginDate || currentDate > endDate) return false
    } else if (beginDate && !endDate) {
        if (currentDate < beginDate) return false
    } else if (!beginDate && endDate) {
        if (currentDate > endDate) return false
    }
    return true
}

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, BannerSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { error: errorGetList, data: bannerList } = await BannerService.getList(validatedPathParams)
        if (errorGetList) return createResponse(errorGetList.httpStatus, { message: errorGetList.message })

        const currentDate = new Date()

        let activeList = bannerList
            .filter(r => r.isActive)
            .filter(r => {
                const { publishDate = {} } = r
                const { begin, end } = publishDate
                const beginDate = begin ? new Date(begin) : null
                const endDate = end ? new Date(end) : null

                return checkAvalibleDate(beginDate, endDate, currentDate)
            })

        const { countryCode } = validatedPathParams

        // removeUShopUrl(countryCode, activeList)
        
        const data = activeList
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}