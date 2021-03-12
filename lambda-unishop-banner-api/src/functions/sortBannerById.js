const { parseBodyJSON, createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const BannerSchema = require("../schema/bannerSchema")
const BannerService = require("../services/bannerService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

const checkCompletelyId = (newList, oldList) => {
    return JSON.stringify([...newList].sort()) === JSON.stringify([...oldList].sort())
}

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const body = parseBodyJSON(e.body)

        const { error: errorPathParams, value: validatedPathParams } = validateInput(pathParams, BannerSchema.PARAMS_SORT_BY_ID)
        if (errorPathParams) return createResponse(httpStatus.badRequest, { message: errorPathParams.message })

        const { countryCode } = validatedPathParams || {}
        const { isAllow } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { error: errorBody, value: validatedBody } = validateInput(body, BannerSchema.ARRAY_STRING)
        if (errorBody) return createResponse(httpStatus.badRequest, { message: errorBody.message })

        const { error: errorGetList, data: banners } = await BannerService.getList({ countryCode })
        if (errorGetList) return createResponse(errorGetList.httpStatus, { message: errorGetList.message })

        const newList = validatedBody
        const oldList = banners.map(r => r.id)

        const isCompletelyId = checkCompletelyId(newList, oldList)
        if (!isCompletelyId) return createResponse(httpStatus.Conflict, { message: "id not match" })

        const sortedBanners = newList.reduce((list, id) => {
            const foundBanner = banners.find(r => r.id === id)
            list.push(foundBanner)
            return list
        }, [])

        const { error: errorUpdate } = await BannerService.updateList(countryCode, sortedBanners)
        if (errorUpdate) return createResponse(errorUpdate.httpStatus, { message: errorUpdate.message })

        const data = sortedBanners
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}