const Joi = require('joi');

const JoiEmptyToNull = Joi.extend({
    base: Joi.string().allow(null),
    name: 'string',
    coerce: (value, state, options) => value === "" ? null : value,
});

const baseSchema = {
    title: Joi.object().keys({
        english: JoiEmptyToNull.string().allow(''),
        native: JoiEmptyToNull.string().allow('').optional()
    })
        .default({
            english: null,
        }),
    isEnable: Joi.bool().required(),
    isRequireLogin: Joi.bool().required(),
    publishDate: Joi.object().keys({
        begin: Joi.string().allow(null).required(),
        end: Joi.string().allow(null).required(),
    }).default({
        begin: null,
        end: null,
    })
}

module.exports.ADD_NEW = Joi.object().keys({
    ...baseSchema,
    fileName: Joi.string().required(),
    totalBytes: Joi.number().required()
})

module.exports.EDIT = Joi.object().keys(baseSchema)

module.exports.getEditMultipleStatus = key => Joi.array().items({
    id: Joi.string().required(),
    [key] : Joi.bool().required()
})