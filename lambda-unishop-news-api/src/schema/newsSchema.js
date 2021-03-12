const Joi = require('joi');

const languageTextValuesWithDefault = Joi.object().keys({
    english: Joi.string().allow("").default(""),
    native: Joi.string().allow("").default(""),
})

const languageArrayValueWithDefault = Joi.object().keys({
    english: Joi.array().items(Joi.string()).default([]),
    native: Joi.array().items(Joi.string()).default([]),
})

const languageArrayDefault = {
    english: [],
    native: []
}

const languageTextDefault = {
    english: "",
    native: ""
}

const news_Type = ['blog', 'download', 'gallery']
const blog_type = ['post', 'upload']

const CREATE = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    isEnable: Joi.bool().default(0),
    isLoginRequired: Joi.bool().default(0),
    isDisableOnLogin: Joi.bool().default(0),
    type: Joi.string().valid(...news_Type).default(news_Type[0]),
    urlDownload: Joi.string().valid(...blog_type).default(blog_type[0]),
    blogType: Joi.string().default(""),
    // sorting: Joi.number().default(9999),
    publishedAt: Joi.date().iso().allow(null).default(null),
    expiredAt: Joi.date().iso().allow(null).default(null),
    title: languageTextValuesWithDefault.default(languageTextDefault),
    blogContent: languageTextValuesWithDefault.default(languageTextDefault),
    newsImages: languageArrayValueWithDefault.default(languageArrayDefault),
})

const UPDATE = Joi.object().keys({
    id: Joi.number().required(),
    isEnable: Joi.bool().optional(),
    isLoginRequired: Joi.bool().optional(),
    isDisableOnLogin: Joi.bool().optional(),
    publishedAt: Joi.date().iso().allow(null).optional(),
    expiredAt: Joi.date().iso().allow(null).optional(),
    sorting: Joi.number().optional(),
    type: Joi.string().valid(...news_Type).optional(),
    blogType: Joi.string().allow('').optional(),
    urlDownload: Joi.string().optional(),
    title: languageTextValuesWithDefault.optional(),
    blogContent: languageTextValuesWithDefault.optional(),
    newsImages: languageArrayValueWithDefault.optional(),
})

const EDIT_MULTIPLE = Joi.array().min(1).items(UPDATE)

module.exports = {
    CREATE,
    EDIT_MULTIPLE,
}