const Joi = require('joi');
const SitesConfig = require("../config/SitesConfig")
const listOfCountryCode = Object.keys(SitesConfig)
const USAGE_TYPES = ["text", "imageUrls"]

const TYPE = ["beforeLogin", "afterLogin"]

const SHOWONCE = ["showOnlyOnce", "showOnceEverySession"]

const SHOWPAGE = ["menu", "home"]

const languageTextValuesWithDefault = Joi.object().keys({
    english: Joi.string().allow("").default(""),
    native: Joi.string().allow("").default(""),
})


const languageArrayValueWithDefault = Joi.object().keys({
    english: Joi.array().items(Joi.string()).default([]),
    native: Joi.array().items(Joi.string()).default([]),
})

const languageTextDefault = {
    english: "",
    native: ""
}

const languageArrayDefault = {
    english: [],
    native: []
}

const CREATE = Joi.object().keys({
    countryCode: Joi.string().allow("").default("").required(),
    type: Joi.string().valid(...TYPE).default(TYPE[0]),
    showPage: Joi.string().valid(...SHOWPAGE).default(SHOWPAGE[0]),
    isEnable: Joi.bool().default(0),
    sorting: Joi.number().default(1),
    allowOnlyStatus: Joi.array().items(Joi.string()).default([]),
    allowOnlyBa: Joi.array().items(Joi.string()).default([]),
    allowOnlyMarket: Joi.array().items(Joi.string().uppercase().valid(...listOfCountryCode)).default([]),
    usageType: Joi.string().valid(...USAGE_TYPES).default(USAGE_TYPES[0]),
    text: languageTextValuesWithDefault.default(languageTextDefault),
    imageUrls: languageTextValuesWithDefault.default(languageTextDefault),
    isShowOnce: Joi.string().valid(...SHOWONCE).default(SHOWONCE[0]),
})

const EDIT = Joi.object().keys({
    countryCode: Joi.string().required(),
    id: Joi.number().required(),
    type: Joi.string().optional(),
    showPage: Joi.string().valid(...SHOWPAGE).optional(),
    isEnable: Joi.bool().optional(),
    sorting: Joi.number().optional(),
    allowOnlyStatus: Joi.array().items(Joi.string()).optional(),
    allowOnlyBa: Joi.array().items(Joi.string()).optional(),
    allowOnlyMarket: Joi.array().items(Joi.string().uppercase().valid(...listOfCountryCode)).optional(),
    usageType: Joi.string().valid(...USAGE_TYPES).optional(),
    text: languageTextValuesWithDefault.optional(),
    imageUrls: languageTextValuesWithDefault.optional(),
    isShowOnce: Joi.string().valid(...SHOWONCE).optional(),
})

const EDIT_MULTIPLE = Joi.array().min(1).items(EDIT)

const GET_PUBLISH = Joi.object().keys({
    baId: Joi.string().allow(null),
    token: Joi.string().allow(null),
    status: Joi.string().uppercase().allow(null),
    userCountry: Joi.string().uppercase().valid(...listOfCountryCode).allow(null),
})

const POST_ACK_POPUP = Joi.object().keys({
    popupId: Joi.string().allow(null),
    baId: Joi.string().allow(null)
})

module.exports = {
    CREATE,
    EDIT_MULTIPLE,
    GET_PUBLISH,
    POST_ACK_POPUP
}