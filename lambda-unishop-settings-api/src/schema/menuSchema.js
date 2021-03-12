const Joi = require('joi')
const SitesConfig = require("../configs/SitesConfig")
const listOfCountryCode = Object.keys(SitesConfig)

const USAGE_TYPES = ["path", "externalLink", "imageUrls", "handleFunction", "special"]
const LINK_TARGETS = ["_blank", "_self", "_parent", "_top"]

const languageTextValuesWithDefault = Joi.object().keys({
    english: Joi.string().allow("").default(""),
    native: Joi.string().allow("").default(""),
})

const languageTextValuesWithOptional = Joi.object().keys({
    english: Joi.string().allow("").optional(),
    native: Joi.string().allow("").optional(),
})

const languageArrayValueWithDefault = Joi.object().keys({
    english: Joi.array().items(Joi.string()).default([]),
    native: Joi.array().items(Joi.string()).default([]),
})

const languageArrayValueWithOptional = Joi.object().keys({
    english: Joi.array().items(Joi.string()).optional(),
    native: Joi.array().items(Joi.string()).optional(),
})

const languageTextDefault = {
    english: "",
    native: ""
}

const languageArrayDefault = {
    english: [],
    native: []
}

const timeUnit = Joi.object().keys({
    value: Joi.string().isoDate().allow(null).default(null),
    unit: Joi.string().isoDate().allow(null).default(null)
})

const CREATE = Joi.object().keys({
    countryCode: Joi.string().uppercase().valid(...listOfCountryCode).required(),
    menuKey: Joi.string().required(),
    menuGroup: Joi.string().allow(null).default(null),
    isEnable: Joi.bool().default(false),
    isLoginRequired: Joi.bool().default(false),
    isDisableOnLogin: Joi.bool().default(false),
    isHeaderMenu: Joi.bool().default(false),
    iconUrl: Joi.string().uri().allow(null).default(null),
    sorting: Joi.number().default(99999),
    sortingHeader: Joi.number().default(99999),
    usageType: Joi.string().valid(...USAGE_TYPES).default(USAGE_TYPES[0]),
    allowOnlyStatus: Joi.array().items(Joi.string()).default([]),
    allowOnlyRank: Joi.array().items(Joi.string()).default([]),
    allowOnlyBa: Joi.array().items(Joi.string()).default([]),
    allowOnlyMarket: Joi.array().items(Joi.string().uppercase().valid(...listOfCountryCode)).default([]),
    showtimeBefore: timeUnit.default({
        value: null,
        unit: null,
    }),
    showtimeAfter: timeUnit.default({
        value: null,
        unit: null,
    }),
    title: languageTextValuesWithDefault.default(languageTextDefault),
    path: languageTextValuesWithDefault.default(languageTextDefault),
    externalLink: languageTextValuesWithDefault.default(languageTextDefault),
    externalLinkTarget: Joi.string().valid(...LINK_TARGETS).default(LINK_TARGETS[0]),
    imageUrls: languageArrayValueWithDefault.default(languageArrayDefault),
    handleFunction: languageTextValuesWithDefault.default(languageTextDefault),
    special: languageTextValuesWithDefault.default(languageTextDefault),
})

const EDIT = Joi.object().keys({
    id: Joi.number().required(),
    menuGroup: Joi.string().allow(null).optional(),
    isEnable: Joi.bool().optional(),
    isLoginRequired: Joi.bool().optional(),
    isDisableOnLogin: Joi.bool().optional(),
    isHeaderMenu: Joi.bool().optional(),
    iconUrl: Joi.string().uri().allow(null).optional(),
    sorting: Joi.number().optional(),
    sortingHeader: Joi.number().optional(),
    usageType: Joi.string().valid(...USAGE_TYPES).optional(),
    allowOnlyStatus: Joi.array().items(Joi.string()).optional(),
    allowOnlyRank: Joi.array().items(Joi.string()).optional(),
    allowOnlyBa: Joi.array().items(Joi.string()).optional(),
    allowOnlyMarket: Joi.array().items(Joi.string().uppercase().valid(...listOfCountryCode)).optional(),
    showtimeBefore: timeUnit.optional(),
    showtimeAfter: timeUnit.optional(),
    title: languageTextValuesWithOptional.optional(),
    path: languageTextValuesWithOptional.optional(),
    externalLink: languageTextValuesWithOptional.optional(),
    externalLinkTarget: Joi.string().valid(...LINK_TARGETS).optional(),
    imageUrls: languageArrayValueWithOptional.optional(),
    handleFunction: languageTextValuesWithDefault.optional(),
    special: languageTextValuesWithOptional.optional(),
})

const EDIT_MULTIPLE = Joi.array().min(1).items(EDIT)

const GET_PUBLISH = Joi.object().keys({
    baId: Joi.string().allow(null),
    token: Joi.string().allow(null),
    status: Joi.string().uppercase().allow(null),
    rank: Joi.string().allow(null),
    showtimeDate: Joi.string().allow(null),
    userCountry: Joi.string().uppercase().valid(...listOfCountryCode).allow(null),
})

module.exports = {
    CREATE,
    EDIT_MULTIPLE,
    GET_PUBLISH,
}