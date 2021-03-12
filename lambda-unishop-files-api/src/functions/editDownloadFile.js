const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const DownloadFileSchema = require("../schema/downloadFileSchema")
const DownloadfilesService = require("../services/downloadfilesService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        // Check Params
        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE_WITH_ID)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })


        const { countryCode, id } = validatedPathParams

        // Check Permission
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Check data
        const body = parseBodyJSON(e.body)
        const { error: errorValidatedBody, value: validatedBody } = validateInput(body, DownloadFileSchema.EDIT)
        if (errorValidatedBody) return createResponse(httpStatus.badRequest, { message: errorValidatedBody.message })

        // Update data
        const updatedAt = new Date().toISOString()
        const { username: updatedBy } = decodedData
        const editData = {
            updatedAt,
            updatedBy,
            ...validatedBody,   
        }
        const { error: errorUpdate } = await DownloadfilesService.update(countryCode, id, editData)
        if (errorUpdate) return createResponse(errorUpdate.httpStatus, { message: errorUpdate.message })
        // // Get data
        const data = JSON.stringify(editData)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}