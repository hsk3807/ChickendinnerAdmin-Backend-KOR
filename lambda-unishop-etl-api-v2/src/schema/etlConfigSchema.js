const Joi = require('joi')
const { sitesConfig } = require("lib-global-configs")
const listOfCountryCode = Object.keys(sitesConfig)

const _baseSchema = {
    cacheEnable: Joi.bool().optional(),
    cacheRefreshEnable: Joi.bool().optional(),
    cacheRefreshMinutes: Joi.number().optional(),
    cacheExpireMinutes: Joi.number().optional(),
    cacheModuleList: Joi.array().items(Joi.string().valid("onself", "orderHistory", "genealogy")).optional(),
    autoFetchEnable: Joi.bool().optional(),
    autoFetchIsStoreCache: Joi.bool().optional(),
    autoFetchAfterLogin: Joi.bool().optional(),
    autoFetchNumberOfTopOv: Joi.number().min(0).optional(),
}

const GET_ONE = Joi.object().keys({
    ushopCountryCode: Joi.string().uppercase().valid(...listOfCountryCode).required(),
})

const EDIT_ONE = Joi.object().keys({
    ushopCountryCode: Joi.string().uppercase().valid(...listOfCountryCode).required(),
    ..._baseSchema,
})

module.exports = {
    GET_ONE,
    EDIT_ONE,
}