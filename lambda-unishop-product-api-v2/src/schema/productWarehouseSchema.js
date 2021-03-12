const Joi = require('joi')
const { sitesConfig } = require("lib-global-configs")
const listOfCountryCode = Object.keys(sitesConfig)

module.exports.GET_LIST = Joi.object()
    .keys({
        country_code: Joi.string().min(3).empty().uppercase().valid(...listOfCountryCode),
        skip: Joi.number().default(0),
        limit: Joi.number().default(50),
    })
