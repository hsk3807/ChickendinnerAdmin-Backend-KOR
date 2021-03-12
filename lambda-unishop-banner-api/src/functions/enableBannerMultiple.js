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
        const { error: errorValidateParams, value: validatedPathParams } = validateInput(pathParams, BannerSchema.COUNTRY_CODE)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validateBody } = validateInput(body, BannerSchema.MULTIPLE_ENABLE)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const { countryCode } = validatedPathParams
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })


        const editBannerList = validateBody
        const { data: banners } = await BannerService.getList({ countryCode })
        const updatedAt = new Date().toISOString()
        const { username: updatedBy } = decodedData

        const updatedBanners = banners.map(r => {
            const matchedBanner = editBannerList.find(editBanner => editBanner.id == r.id)
            if (matchedBanner) {
                Object.assign(r, {
                    isActive: matchedBanner.isActive,
                    updatedBy,
                    updatedAt,
                })
            }
            return r
        })

        await BannerService.updateList(countryCode, updatedBanners)

        const data = updatedBanners
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}