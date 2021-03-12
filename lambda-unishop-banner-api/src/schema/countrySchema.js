const Joi = require('joi');
const {
    languageCodeSchema,
} = require('./generalSchema')

module.exports.CREATE_NEW = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    languagesUsage: Joi.array()
        .items(languageCodeSchema.required())
        .default(["EN"]),
})