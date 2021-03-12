const Joi = require('joi')
const { sitesConfig } = require("lib-global-configs")
const listOfCountryCode = Object.keys(sitesConfig) 

module.exports.VALID_COUNTRY = Joi.string().min(3).empty().uppercase().valid(...listOfCountryCode)