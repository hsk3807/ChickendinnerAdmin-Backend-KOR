const Joi = require('joi')
const SitesConfig = require("../configs/SitesConfig")
const listOfCountryCode = Object.keys(SitesConfig)

const _baseSchema = {
    approval_status: Joi.string().allow(null).valid("0", "1").optional(),
    approval_reject_type: Joi.number().allow(null).optional(),
    approval_reject_reason: Joi.string().allow(null).optional(),
}

const EDIT_DATA = Joi.object().keys({
    id: Joi.number().required(),
    ..._baseSchema,
})

module.exports.GET_LIST = Joi.object()
    .keys({
        country_code: Joi.string().uppercase().valid(...listOfCountryCode).required(),
        approval_status: Joi.string().valid("null", "0", "1").optional(),
        approval_reject_type: Joi.number().optional(),
        keywords: Joi.array().items(Joi.string()).default([]),
        keywords_not: Joi.array().items(Joi.string()).default([]),
        skip: Joi.number().default(0),
        limit: Joi.number().default(100),
    })

module.exports.EDIT_DATA_ARRAY = Joi.array().items(EDIT_DATA).min(1).required()

module.exports.MOVE_IMAGES_TO_PRIVATE = Joi.object()
    .keys({
        country_code: Joi.string().uppercase().valid(...listOfCountryCode).required(),
        list: Joi.array()
            .items(
                Joi.object().keys({
                    fileName: Joi.string().required(),
                    rename: Joi.string().optional(),
                })
            )
             .min(1)
             .required(),
    })