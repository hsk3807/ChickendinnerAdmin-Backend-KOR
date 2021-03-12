const Joi = require('joi');

module.exports.COUNTRY_CODE = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
})
