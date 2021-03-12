const Joi = require('joi')
const { sitesConfig } = require("lib-global-configs")
const listOfCountryCode = Object.keys(sitesConfig)

const _baseSchema = {
    country_code: Joi.string().min(3).empty().uppercase().valid(...listOfCountryCode).required(),
    name: Joi.object().keys({
        english: Joi.string().allow("").optional(),
        native: Joi.string().allow("").optional(),
    }).optional(),
    sorting: Joi.number().allow(null).optional(),
}

module.exports.NEW_DATA = Joi.object().keys({
    ..._baseSchema,
})

const EDIT_DATA = Joi.object().keys({
    id: Joi.number().required(),
    ..._baseSchema,
})

module.exports.GET_LIST = Joi.object()
    .keys({
        country_code: Joi.string().min(3).empty().uppercase().valid(...listOfCountryCode),
        skip: Joi.number().default(0),
        limit: Joi.number().default(50),
    })

module.exports.EDIT_DATA_ARRAY = Joi.array().items(EDIT_DATA).min(1).required()