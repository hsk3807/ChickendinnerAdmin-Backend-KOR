const uuid = require('uuid')
const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const DownloadFileSchema = require("../schema/downloadFileSchema")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')
const DownloadfilesService = require("../services/downloadfilesService")

const moveFile = async (countryCode, fileName) => {
    await DownloadfilesService.copyFileToPrivate(countryCode, fileName)
    await DownloadfilesService.removeTempFile(fileName)
}

const addData = async (countryCode, username, data) => {
    const id = uuid.v1()
    const createdBy = username
    const createdAt = new Date().toISOString()
    const updatedAt = createdAt
    const updatedBy = createdBy
    const newData = {
        id,
        createdBy,
        createdAt,
        updatedAt,
        updatedBy,
        ...data,
    }

    return await DownloadfilesService.addData(countryCode, newData)
}

module.exports.handler = async e => {
    try {

        const pathParams = e.pathParameters || {}
        const { error: errorValidateParams, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const { countryCode } = validatedPathParams
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const body = parseBodyJSON(e.body)
        const { error: errorValidatedBody, value: validatedBody } = validateInput(body, DownloadFileSchema.ADD_NEW)
        if (errorValidatedBody) return createResponse(httpStatus.badRequest, { message: errorValidatedBody.message })

        const { fileName } = validatedBody
        const { username } = decodedData

        await moveFile(countryCode, fileName)
        const { error: errorAddData, data: newDownloadFiles } = await addData(countryCode, username, validatedBody)
        if (errorAddData) {
            await DownloadfilesService.removeFile(countryCode, fileName)
            return createResponse(errorAddData.httpStatus, { message: errorAddData.message })
        }

        const data = JSON.stringify(newDownloadFiles)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}