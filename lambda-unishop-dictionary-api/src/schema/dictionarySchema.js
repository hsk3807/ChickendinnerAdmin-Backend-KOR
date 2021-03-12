const Joi = require('joi');

const getListOfDictCols = listOfLanguages => listOfLanguages
    .reduce((obj, code) => ({
        ...obj, [`dic_${code}`]: Joi.string().allow("").allow(null).default("").optional()
    }), {})

module.exports.getSchemaLanguageList = listOfLanguages =>
    Joi.array().items(Joi.string().uppercase().length(2).valid(listOfLanguages))

module.exports.getSchemaEditMultiple = listOfLanguages => {

    return Joi.array()
        .min(1)
        .items(Joi.object().keys({
            id: Joi.string().required(),
            ...getListOfDictCols(listOfLanguages)
        }))
}

module.exports.getSchemaAddNew = listOfLanguages => {
    return Joi.object().keys({
        id: Joi.string().required(),
        ...getListOfDictCols(listOfLanguages)
    })
}