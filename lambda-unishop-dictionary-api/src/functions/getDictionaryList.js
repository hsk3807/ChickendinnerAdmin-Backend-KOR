const { createResponse, httpStatus, extractSortings } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const DictionaryService = require('../services/dictionaryService')
const dictionarySchema = require('../schema/dictionarySchema')

module.exports.handler = async e => {
    try {
        const {
            multiValueQueryStringParameters,
            queryStringParameters,
        } = e

        let {
            lang: inputLanguages = "",
            skip,
            limit,
            isOnlyEmptyText,
        } = queryStringParameters || {}

        const {
            keywords,
        } = multiValueQueryStringParameters || {}

        // Check Languages Parameters
        const inputLanguageList = inputLanguages.replace(/ /g, "").split(',').filter(code => !!code).map(code => code.toUpperCase())
        const listOfLanguages = await DictionaryService.getListOfLanguages()
        const { error: errorLanguage, value: listOfLanguageValid } = validateInput(inputLanguageList, dictionarySchema.getSchemaLanguageList(listOfLanguages))
        if (errorLanguage) return createResponse(httpStatus.badRequest, { message: errorLanguage.message })
        if (listOfLanguageValid.length < 1) return createResponse(httpStatus.notFound, { message: 'Not found.' })

        if (!skip) skip = 0
        if (!limit) limit = 50

        const sortings = extractSortings(queryStringParameters, "sort_")

        const filterNullColumnsOr = isOnlyEmptyText ? listOfLanguageValid.filter(code => code !== "EN") : []

        const data = await DictionaryService.getList(
            listOfLanguageValid,
            {
                skip,
                limit,
                keywords,
                sortings,
                filterNullColumnsOr,
                withHistory: true
            }
        )
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}