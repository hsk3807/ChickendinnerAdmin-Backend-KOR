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

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams
        const { isAllow, decodedData: { username } } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const body = parseBodyJSON(e.body)
        const keyStatus = 'isEnable'
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, DownloadFileSchema.getEditMultipleStatus(keyStatus))
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        let { error: errorGetListData, data: downloadFiles } = await DownloadfilesService.getListData(countryCode)
        if (errorGetListData) return createResponse(errorGetListData.httpStatus, { message: errorGetListData.message })

        // Edit Status
        const updatedAt = new Date().toISOString()
        const downloadFilesEdited = downloadFiles.map(r => {
            const foundIndex = validatedBody.findIndex(({ id }) => id == r.id)
            return foundIndex > -1
                ? {
                    ...r,
                    ...{
                        [keyStatus]: validatedBody[foundIndex][keyStatus],
                        updatedBy: username,
                        updatedAt
                    }
                }
                : r
        })

        const { error: errorUpdateList } = await DownloadfilesService.updateList(countryCode, downloadFilesEdited)
        if (errorUpdateList) return createResponse(errorUpdateList.httpStatus, { message: errorUpdateList.message })

        const data = JSON.stringify(downloadFilesEdited)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err.message })
    }
}