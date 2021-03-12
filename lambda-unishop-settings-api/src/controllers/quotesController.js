const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const quotesService = require('../services/quotesService')

const getRandomOne = async e => {
    try {
        const { type } = e.pathParameters || {}
        const result = await quotesService.getRandomOne(type)

        const data = {
            url: `https://ushop-media.unicity.com/${result.Key}`
        }

        return data
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: "NotFound." })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

module.exports = {
    getRandomOne
}