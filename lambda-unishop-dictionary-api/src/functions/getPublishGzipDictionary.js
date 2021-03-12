const keyBy = require('lodash.keyby')
const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const DictionaryService = require('../services/dictionaryService')
const dictionarySchema = require('../schema/dictionarySchema')



module.exports.handler = async e => {
    try {
        const {
            lang = "",
        } = e.queryStringParameters || {}

        const listOfLanguage = lang.replace(/ /g, "").split(',').filter(code => !!code).map(code => code.toUpperCase())
        const allLanguages = await DictionaryService.getListOfLanguages()

        const { error: errorLanguage, value: listOfLanguageValid } = validateInput(listOfLanguage, dictionarySchema.getSchemaLanguageList(allLanguages))
        if (errorLanguage) return createResponse(httpStatus.badRequest, { message: errorLanguage.message })
        if (listOfLanguageValid.length < 1) return createResponse(httpStatus.notFound, { message: 'Not found.' })

        const dt = await DictionaryService.getList(listOfLanguageValid)
        const [firstRow] = dt || []
        if (!firstRow) return createResponse(httpStatus.noContent, { message: 'No content.' })

        const defaultDic = listOfLanguageValid.reduce((obj, code) => ({ ...obj, [code]: {} }), {})
        const dictObj = listOfLanguageValid.reduce((obj, code) => {

            obj[code] = keyBy(dt.map(({ id, [`dic_${code}`]: value }) => ({ id, [code]: value })), `id`)
            obj[code] = obj[code]
            // obj[code] = dt.map(({ id, [`dic_${code}`]: value }) => ({ id, [code]: value }))
            return obj
        }, defaultDic)

        const resultObj = Object.keys(dictObj).reduce((obj1, code) => {

            obj1[code] = Object.keys(dictObj[code]).reduce((obj2, key)=>{
                obj2[key] = dictObj[code][key][code]
                return obj2
            }, {})

            return obj1
        }, {})

        const data = resultObj
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}