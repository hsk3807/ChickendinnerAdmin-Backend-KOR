const Joi = require('joi')
const SitesConfig = require("../configs/SitesConfig")
const listOfCountryCode = Object.keys(SitesConfig) 

module.exports.VALID_COUNTRY = Joi.string().length(3).uppercase().valid(...listOfCountryCode)