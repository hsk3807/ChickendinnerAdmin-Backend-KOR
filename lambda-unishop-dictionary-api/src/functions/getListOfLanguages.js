const { createResponse, httpStatus } = require('../utils/helpers')
const DictionaryService = require('../services/dictionaryService')

module.exports.handler = async e => {
    try {
        const data = await DictionaryService.getListOfLanguages()
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}