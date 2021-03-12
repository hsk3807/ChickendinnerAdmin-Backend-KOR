const { createResponse, httpStatus } = require('../utils/helpers')
const PermissionHelpers = require('../utils/permissionHelpers')
const { validateInput } = require('../utils/validator')
const DictionaryService = require('../services/dictionaryService')
const DictionaryHistoryService = require('../services/dictionaryHistoryService')

module.exports.handler = async e => {
    try {
        const { Authorization } = e.headers

        const decodedData = PermissionHelpers.getDecodeToken(Authorization)

        // Check Full Access
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Delete data
        const { id } = e.pathParameters
        const data = await DictionaryService.deleteById(id)

        // Delete history data
        await DictionaryHistoryService.deleteByDictionaryId(id)

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}