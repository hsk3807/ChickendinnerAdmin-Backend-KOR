const Joi = require("joi")
const MappingStatusList = require("../configs/MappingStatusList")
const SitesConfig = require("../configs/SitesConfig")

const listOfCountryCode = Object.keys(SitesConfig)
const ONLY_STATUS_LIST = MappingStatusList.map(r => r.code)

const _baseSchema = {
    login: Joi.object().keys({
        allowOnlyStatus: Joi.array().items(Joi.string().valid(...ONLY_STATUS_LIST)).optional(),
        allowOnlyMarket: Joi.array().items(Joi.string().valid(...listOfCountryCode)).optional(),
        disallowOnlyMarket: Joi.array().items(Joi.string().valid(...listOfCountryCode)).optional(),
    }).optional(),
}

const EDIT_DATA = Joi.object().keys({
    countryCode: Joi.string().uppercase().valid(...listOfCountryCode).required(),
    ..._baseSchema,
})

module.exports = {
    EDIT_DATA,
}
