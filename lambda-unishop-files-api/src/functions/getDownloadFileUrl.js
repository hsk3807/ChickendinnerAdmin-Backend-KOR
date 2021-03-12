const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const DownloadfilesService = require("../services/downloadfilesService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')


const fileNameAndExt = fileNameStr => {
    const file = fileNameStr.split('/').pop();
    return [file.substr(0, file.lastIndexOf('.')), file.substr(file.lastIndexOf('.') + 1, file.length)]
}

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters || {}

        // Check Params
        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE_WITH_ID)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })


        const { countryCode, id } = validatedPathParams

        // Check Permission
        const { isAllow } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Get data
        const { error: errorGetData, data: downloadFileData } = await DownloadfilesService.getData(countryCode, id)
        if (errorGetData) return createResponse(errorGetData.httpStatus, { message: errorGetData.message })

        const {
            fileName: targerFileName,
            title: { english: titleEnglish },
        } = downloadFileData
        const [sourceFileName, fileExt] = fileNameAndExt(targerFileName)

        const reFileName = titleEnglish ?  titleEnglish.replace(/ /g, "_").replace(/[^a-z0-9_.]/gi,'') : sourceFileName
        const overwriteFileName = `${reFileName}.${fileExt}`
        const publicLink = await DownloadfilesService.copyFileToPublicLink(countryCode, targerFileName, overwriteFileName)
        const { url } = publicLink || {}
        if (!url) return createResponse(httpStatus.Gone, { message: 'Expired.' })

        const data = JSON.stringify({ ...publicLink })
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}