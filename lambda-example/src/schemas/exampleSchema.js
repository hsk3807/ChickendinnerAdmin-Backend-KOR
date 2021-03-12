const Joi = require('joi')

const _baseSchema = { 
    value_text: Joi.string().allow("").default(""),
    value_number: Joi.number().default(0),
}

const CREATE_DATA = Joi.object().keys({
    ..._baseSchema,
})

const UPDATE_DATA = Joi.object().keys({
    id: Joi.number().required(),
    ..._baseSchema,
})

const GET_LIST = Joi.object().keys({
    skip: Joi.number().default(0),
    limit: Joi.number().default(100),
})

module.exports = {
    CREATE_DATA,
    UPDATE_DATA,
    GET_LIST,
}