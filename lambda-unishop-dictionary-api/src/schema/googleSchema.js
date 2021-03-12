const Joi = require('joi');
const LanguagesConfig = require('../configs/LanguagesConfig')

const listOfLangugagesValid = Object.keys(LanguagesConfig)

module.exports.LIST_OF_TRANSLATE = Joi.array()
    .items(
        Joi.object().keys({
            source: Joi.string().valid(listOfLangugagesValid).allow(null).optional(),
            target: Joi.string().valid(listOfLangugagesValid).required(),
            content: Joi.string().required()
        })
    )