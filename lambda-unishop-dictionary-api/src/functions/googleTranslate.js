const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GoogleSchema = require('../schema/googleSchema')
const GoogleService = require('../services/googleService')
const LanguagesConfig = require('../configs/LanguagesConfig')

module.exports.handler = async e => {
    try {
        const body = parseBodyJSON(e.body)

        const { error: errorValidateBody, value: bodyValidated } = validateInput(body, GoogleSchema.LIST_OF_TRANSLATE)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })
        if (bodyValidated.length < 1) return createResponse(httpStatus.badRequest, { message: 'No content for translation.' })

        const listOfTranslate = bodyValidated
            .map(({ source, target, content }) => ({
                source: source ? LanguagesConfig[source].ISO639_1 : null,
                target: LanguagesConfig[target].ISO639_1,
                content
            }))

        const translatedResults = await GoogleService.translateMultiple(listOfTranslate)

        const data = bodyValidated.map((r, index) => {
            const { value, reason: error } = translatedResults[index] || {}
            return { ...r, value, error }
        })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}