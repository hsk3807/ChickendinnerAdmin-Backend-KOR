const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const DownloadfilesService = require("../services/downloadfilesService")
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')

const checkCompletelyId = (newList, oldList) =>
    JSON.stringify([...newList].sort()) === JSON.stringify([...oldList].sort())

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

        const { error: errorGetListData, data: downloadFiles } = await DownloadfilesService.getListData(countryCode)
        if (errorGetListData) return createResponse(errorGetListData.httpStatus, { message: errorGetListData.message })

        const newList = validatedBody
        const oldList = downloadFiles.map(r => r.id)
        const isCompletelyId = checkCompletelyId(newList, oldList)
        if (!isCompletelyId) return createResponse(httpStatus.Conflict, { message: "id not match" })

        const sortedDownloadFiles = newList.reduce((list, id) => {
            const foundItem = downloadFiles.find(r => r.id === id)
            list.push(foundItem)
            return list
        }, [])

        const { error: errorUpdateList } = await DownloadfilesService.updateList(countryCode, sortedDownloadFiles)
        if (errorUpdateList) return createResponse(errorUpdateList.httpStatus, { message: errorUpdateList.message })

        const data = JSON.stringify(sortedDownloadFiles)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}