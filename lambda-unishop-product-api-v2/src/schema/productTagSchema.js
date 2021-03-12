const Joi = require('joi')
const { sitesConfig } = require("lib-global-configs")
const listOfCountryCode = Object.keys(sitesConfig)
const TagService = require("../services/productTagService")
const { validateInput } = require('../utils/validator')

const hexColor = Joi.string().regex(/^#[A-Fa-f0-9]{6}$/)

const getBaseKeys = async () => {
    const listOfLanguage = await TagService.getListOfLanguages()
    const textKeys = listOfLanguage
        .reduce((obj, code) => ({
            ...obj,
            [code]: Joi.string().allow("").optional(),
        }), {})

    return {
        sorting: Joi.number().allow(null).optional(),
        style: Joi.object().keys({
            color: hexColor.allow(null).optional(),
            background_color: hexColor.allow(null).optional(),
        }).optional(),
        text: Joi.object().keys(textKeys).optional(),
    }
}

module.exports.getCreateSchema = async () => {
    const baseKeys = await getBaseKeys()
    return Joi.object().keys({
        name: Joi.string().required(),
        ...baseKeys
    })
}

module.exports.getEditSchemaList = async () => {
    const baseKeys = await getBaseKeys()
    return Joi.array()
        .items(Joi.object().keys({
            id: Joi.number().required(),
            ...baseKeys,
        }))
        .min(1).required()
}

module.exports.GET_LIST = Joi.object()
    .keys({
        country_code: Joi.string().min(3).empty().uppercase().valid(...listOfCountryCode),
        isNativeLanguage: Joi.bool().default(false),
        is_system_tags: Joi.bool().default(null),
        skip: Joi.number().default(0),
        limit: Joi.number().default(50),
    })