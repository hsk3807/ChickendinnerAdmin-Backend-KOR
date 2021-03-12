const Joi = require('joi');

module.exports.COUNTRY_CODE = Joi.object().keys({
    countryCode: Joi.string().min(3).empty().uppercase().required(),
})
