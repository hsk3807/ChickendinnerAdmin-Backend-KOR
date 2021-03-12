const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const DownloadfilesService = require("../services/downloadfilesService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams
        const { isAllow } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, GeneralSchema.ARRAY_STRING)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        let { error: errorGetListData, data: downloadFiles } = await DownloadfilesService.getListData(countryCode)
        if (errorGetListData) return createResponse(errorGetListData.httpStatus, { message: errorGetListData.message })

        // remove files
        const deleteFileNameList = downloadFiles
            .filter(({ id }) => validatedBody.includes(id))
            .map(({ fileName }) => fileName)
        await DownloadfilesService.removeFileMultiple(countryCode, deleteFileNameList)

        // update db 
        const remainList = downloadFiles.filter(({ id }) => !validatedBody.includes(id))
        const { error: errorDeleteList } = await DownloadfilesService.updateList(countryCode, remainList)
        if (errorDeleteList) return createResponse(errorDeleteList.httpStatus, { message: errorDeleteList.message })

        const data = JSON.stringify(remainList)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err.message })
    }
}