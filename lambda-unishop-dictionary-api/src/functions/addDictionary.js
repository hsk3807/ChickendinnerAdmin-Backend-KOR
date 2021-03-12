const { createResponse, httpStatus, parseBodyJSON, generateChecksum } = require('../utils/helpers')
const PermissionHelpers = require('../utils/permissionHelpers')
const { validateInput } = require('../utils/validator')
const dictionarySchema = require('../schema/dictionarySchema')
const DictionaryService = require('../services/dictionaryService')
const DictionaryHistoryService = require('../services/dictionaryHistoryService')


module.exports.handler = async e => {
    try {
        const { Authorization } = e.headers
        const body = parseBodyJSON(e.body)

        const decodedData = PermissionHelpers.getDecodeToken(Authorization)

        // Check Full Access
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Check Body Schema
        const listOfEditableLanguages = await DictionaryService.getListOfLanguages()
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, dictionarySchema.getSchemaAddNew(listOfEditableLanguages))
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Check Duplicate Key
        const { id } = validatedBody
        const foundData = await DictionaryService.getById(id);
        if (foundData) return createResponse(httpStatus.Conflict, { message: `Key "${id}" already exists.` })

        // Add
        const { username: createdBy } = decodedData
        const createdAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const updatedBy = createdBy
        const updatedAt = createdAt
        const newData = {
            ...validatedBody,
            createdBy,
            createdAt,
            updatedBy,
            updatedAt
        }
        const data = await DictionaryService.add(newData)

        // Add History
        const newHistoryList = Object.keys(newData)
            .filter(key => /^dic_/.test(key))
            .filter(key => newData[key])
            .map(key => ({
                createdBy,
                createdAt,
                updatedBy,
                updatedAt,
                dictionaryId: id,
                languageCode: key.replace("dic_", ""),
                dataChecksum: generateChecksum(newData[key]),
                data: newData[key],
            }))
        await DictionaryHistoryService.addMultiple(newHistoryList)

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}