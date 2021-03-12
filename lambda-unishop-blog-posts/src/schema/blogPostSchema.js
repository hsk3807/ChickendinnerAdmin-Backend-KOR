const Joi = require('joi');

module.exports.CREATE = Joi.object().keys({
    channel: Joi.string().allow(null).default(null),
    ref: Joi.string().allow(null).default(null),
    title_english: Joi.string().allow("").default(""),
    title_native: Joi.string().allow("").default(""),
    content_english: Joi.string().max(200000).allow("").default(""),
    content_native: Joi.string().max(200000).allow("").default(""),
})

module.exports.UPDATE = Joi.object().keys({
    channel: Joi.string().allow(null).optional(),
    ref: Joi.string().allow(null).optional(),
    title_english: Joi.string().allow("").optional(),
    title_native: Joi.string().allow("").optional(),
    content_english: Joi.string().max(200000).allow("").optional(),
    content_native: Joi.string().max(200000).allow("").optional(),
})