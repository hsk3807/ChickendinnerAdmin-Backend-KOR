const { createResponse, httpStatus, parseBodyJSON, generateChecksum } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const DictionaryService = require('../services/dictionaryService')
const dictionarySchema = require('../schema/dictionarySchema')
const GeneralSchema = require('../schema/generalSchema')
const PermissionHelpers = require('../utils/permissionHelpers')
const languageHelper = require('../utils/languageHelper')
const ACCESS = require('../utils/accessConfig')
const DictionaryHistoryService = require('../services/dictionaryHistoryService')

module.exports.handler = async e => {
    try {
        const { Authorization } = e.headers
        const pathParams = e.pathParameters || {}
        const body = parseBodyJSON(e.body)

        // Check path params
        const { error: errorValidatePathParams, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidatePathParams) return createResponse(httpStatus.badRequest, { message: errorValidatePathParams.message })

        // Check normal permissions
        const { countryCode } = validatedPathParams
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Check normal editable languages
        const { isFullAccess } = PermissionHelpers.getDecodeToken(Authorization)
        const listOfEditableLanguages = isFullAccess
            ? await DictionaryService.getListOfLanguages()
            : languageHelper.getLanguagesListByCountry(countryCode).filter(code => code !== "EN")
        if (listOfEditableLanguages.length < 1) return createResponse(httpStatus.notFound, { message: 'Editable data not found.' })

        // Check edit data
        const { error: errorValidateBody } = validateInput(body, dictionarySchema.getSchemaEditMultiple(listOfEditableLanguages))
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Edit Data
        const { username: updatedBy } = decodedData
        const updatedAt = new Date().toISOString()
        const editDataList = body.map(r => ({ ...r, updatedBy, updatedAt }))
        const editedData = await DictionaryService.editMultiple(editDataList)

        // Update existig history
        const compareHistoryRows = editedData.reduce((list, row) => {
            const { id: dictionaryId } = row
            const newHistories = Object.keys(row)
                .filter(key => /^dic_/.test(key))
                .map(key => {
                    return {
                        dictionaryId,
                        languageCode: key.replace(/^dic_/, ""),
                        dataChecksum: generateChecksum(row[key]),
                        data: row[key],
                    }
                })
            return [...list, ...newHistories]
        }, [])
        const existHistoryList = await DictionaryHistoryService.getExistsList(compareHistoryRows)
        const updateHistoryList = existHistoryList.map(({ id }) => ({ id, updatedBy, updatedAt }))
        if (updateHistoryList.length > 0) await DictionaryHistoryService.updateMultiple(updateHistoryList)

        // Add new history
        const newHistoryList = compareHistoryRows
            .filter(row => {
                const { dictionaryId, languageCode, dataChecksum, data } = row
                return existHistoryList
                    .findIndex(r =>
                        r.dictionaryId === dictionaryId &&
                        r.languageCode === languageCode &&
                        r.dataChecksum === dataChecksum
                    ) === -1 && data
            })
        const createdAt = updatedAt
        const createdBy = updatedBy
        const insertHistoryList = newHistoryList.map(r => ({ ...r, updatedBy, updatedAt, createdAt, createdBy }))
        if (insertHistoryList.length > 0) await DictionaryHistoryService.addMultiple(insertHistoryList)

        const listOfId = body.map(({ id }) => id)
        const [firstBodyItem] = body
        const listOfLanguage = Object.keys(firstBodyItem)
            .filter(key => /^dic_/.test(key))
            .map(key => key.replace(/^dic_/, ""))
        const data = await DictionaryService.getList(
            listOfLanguage,
            {
                filterIn: { id: listOfId },
                withHistory: true
            })
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}