const Joi = require('joi')
const { sitesConfig } = require("lib-global-configs")
const listOfCountryCode = Object.keys(sitesConfig)

const baseSchema = {
    tokenHydra: Joi.string().required(),
    baId: Joi.string().required(),
    token: Joi.string().required(),
    ushopCountryCode: Joi.string().uppercase().valid(...listOfCountryCode).required(),
    collapse: Joi.array().items(Joi.string().valid('ushop', 'hydra')).max(1).default([]),
    byPassCache: Joi.number().valid(0, 1).default(0),
}

const GET_ETL_BASE = Joi.object().keys(baseSchema)

const GET_ETL_ORDER_HISTORY = Joi.object().keys({
    ...baseSchema,
    periodStart: Joi.string().allow(null).default(null),
    periodEnd: Joi.string().allow(null).default(null),
})

const GET_ETL_GENEALOGY = Joi.object().keys({
    ...baseSchema,
    maxTreeDepth: Joi.number().default(1),
    limit: Joi.number().default(256),
    periodStart: Joi.string().allow(null).default(null),
    periodEnd: Joi.string().allow(null).default(null),
    isAutoFetchTopOv: Joi.number().valid(0, 1).default(1)
})

const LOGIN_TOKENS = Joi.object().keys({
    ushopCountryCode: Joi.string().uppercase().valid(...listOfCountryCode).required(),
    collapse: Joi.array().items(Joi.string().valid('ushop', 'hydra')).max(1).default([]),
    byPassCache: Joi.number().valid(0, 1).default(0),
})

const GET_MENU = Joi.object().keys({
    ushopCountryCode: Joi.string().uppercase().valid(...listOfCountryCode).required(),
    tokenHydra: Joi.string().allow(null).default(null),
    baId: Joi.string().allow(null).default(null),
    token: Joi.string().allow(null).default(null),
    collapse: Joi.array().items(Joi.string().valid('ushop', 'hydra')).max(1).default([]),
    byPassCache: Joi.number().valid(0, 1).default(0),
})

module.exports = {
    GET_ETL_BASE,
    GET_ETL_ORDER_HISTORY,
    GET_ETL_GENEALOGY,
    LOGIN_TOKENS,
    GET_MENU,
}