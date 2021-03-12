const Joi = require('joi');
const languageCodes = require('../utils/languageCodes')

var JoiEmptyToNull = Joi.extend({
    base: Joi.string().allow(null),
    name: 'string',
    coerce: (value, state, options) => value === "" ? null : value,
});

module.exports.colorSchema = Joi.string()
    .uppercase()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)

module.exports.opacityColorSchema = Joi.object()
    .keys({
        hex: Joi.string()
            .uppercase()
            .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
        opacity: Joi.number().min(0).max(1),
    })

module.exports.textContentSchema = Joi.object()
    .keys(languageCodes.map(r => r.toUpperCase()).reduce((obj, code) => {
        obj[code] = JoiEmptyToNull.string().allow('')
        return obj
    }, {}))

module.exports.urlContentSchema = Joi.object()
    .keys(languageCodes.map(r => r.toUpperCase()).reduce((obj, code) => {
        obj[code] = JoiEmptyToNull.string().allow('')
        return obj
    }, {}))

module.exports.arrayTextContentSchema = Joi.object()
    .keys(languageCodes.map(r => r.toUpperCase()).reduce((obj, code) => {
        obj[code] = Joi.array().items(JoiEmptyToNull.string().allow(''))
        return obj
    }, {}))

module.exports.languageCodeSchema = Joi.string().length(2).uppercase()

module.exports.alignDeviceSchema = Joi.object()
    .keys({
        laptop: Joi.string().valid(["middleCenter", "middleRight", "middleLeft"]),
        mobile: Joi.string().valid(["middleCenter", "middleRight", "middleLeft"]),
    })

