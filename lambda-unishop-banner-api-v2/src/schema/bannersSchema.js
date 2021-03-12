const Joi = require('joi');

const USAGE_TYPES = ["path", "externalLink", "imageUrls", "handleFunction", "noaction"]
const LINK_TARGETS = ["_blank", "_self", "_parent", "_top"]


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
    countryCode: Joi.string().allow("").default(""),
    isEnable: Joi.bool().default(0),
    isLoginRequired: Joi.bool().default(0),
    isDisableOnLogin: Joi.bool().optional(),
    sorting: Joi.number().default(9999),
    bannerImageUrl: Joi.object(),
    usageType: Joi.string().valid(...USAGE_TYPES).default(USAGE_TYPES[0]),
    path: languageTextValuesWithDefault.default(languageTextDefault),
    externalLink: languageTextValuesWithDefault.default(languageTextDefault),
    externalLinkTarget: Joi.string().valid(...LINK_TARGETS).default(LINK_TARGETS[0]),
    imageUrls: languageArrayValueWithDefault.default(languageArrayDefault),
    handleFunction: languageTextValuesWithDefault.default(languageTextDefault),
})

const EDIT = Joi.object().keys({
    countryCode: Joi.string().required(),
    id: Joi.number().required(),
    isEnable: Joi.bool().optional(),
    isLoginRequired: Joi.bool().optional(),
    isDisableOnLogin: Joi.bool().optional(),
    sorting: Joi.number().optional(),
    bannerImageUrl: languageTextValuesWithDefault.optional(),
    usageType: Joi.string().valid(...USAGE_TYPES).optional(),
    path: languageTextValuesWithDefault.optional(),
    externalLink: languageTextValuesWithDefault.optional(),
    externalLinkTarget: Joi.string().valid(...LINK_TARGETS).optional(),
    imageUrls: languageArrayValueWithDefault.optional(),
    handleFunction: languageTextValuesWithDefault.optional(),

})

const EDIT_MULTIPLE = Joi.array().min(1).items(EDIT)

module.exports = {
    CREATE,
    EDIT_MULTIPLE,
}

