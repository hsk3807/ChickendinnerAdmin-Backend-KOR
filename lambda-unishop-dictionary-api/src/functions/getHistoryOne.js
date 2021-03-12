

const { createResponse, httpStatus } = require('../utils/helpers')
const DictionaryHistoryService = require('../services/dictionaryHistoryService')

module.exports.handler = async e => {
    try {      
        const { id } = e.pathParameters

        const data = await DictionaryHistoryService.getOne(id)
        return data 
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, {message: "NotFound."})
            
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}
