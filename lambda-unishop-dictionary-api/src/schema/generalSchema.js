const Joi = require('joi');

module.exports.ID = Joi.object().keys({
    id: Joi.string().required(),
})

module.exports.COUNTRY_CODE = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
})

module.exports.COUNTRY_CODE_WITH_WAREHOUSE = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    warehouse: Joi.string().required(),
})

module.exports.PATH_PARAMS_PRODUCT = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    id: Joi.number(),
})

module.exports.LIST_NUMBER = Joi.array().items(Joi.number().required())