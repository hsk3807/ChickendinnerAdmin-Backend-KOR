const Joi = require('joi');

module.exports.COUNTRY_CODE = Joi.object().keys({
    countryCode: Joi.string().uppercase().required()
})

module.exports.COUNTRY_CODE_WITH_ID = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    id: Joi.string().required(),
})

module.exports.ARRAY_STRING = Joi.array().items(Joi.string().required()).required()