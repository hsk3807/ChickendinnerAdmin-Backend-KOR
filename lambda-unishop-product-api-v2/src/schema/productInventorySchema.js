const Joi = require('joi')

const _baseSchema = {
    is_enable: Joi.boolean().optional(),
    is_allow_backorder: Joi.boolean().optional(),
    qty: Joi.object().keys({
        buffer: Joi.number().optional(),
    }).optional(),
}

const EDIT_DATA = Joi.object().keys({
    id: Joi.number().required(),
    ..._baseSchema,
})

const NEW_DATA = Joi.object().keys({
    warehouse_id: Joi.number().required(),
    ..._baseSchema,
})

module.exports = {
    EDIT_DATA,
    NEW_DATA,
}
