const uuid = require('uuid')
const { parseBodyJSON, createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const BannerSchema = require("../schema/bannerSchema")
const BannerService = require("../services/bannerService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {
        const body = parseBodyJSON(e.body)
        const { error: errorValidate, value: validateBody } = validateInput(body, BannerSchema.ADD)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })
        
        const { countryCode } = validateBody || {}
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })
        
        const { username: createdBy } = decodedData
        const createdAt = new Date().toISOString()
        const updatedAt = createdAt
        const updatedBy = createdBy
        
        const data = {
            id: uuid.v1(),
            createdAt,
            updatedAt,
            updatedBy,
            ...validateBody,
        }
        const { error: errorInsert } = await BannerService.add(data)
        if (errorInsert) return createResponse(errorInsert.httpStatus, { message: errorInsert.message })

        return createResponse(httpStatus.created, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}