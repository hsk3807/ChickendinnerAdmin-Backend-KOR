const Joi = require('joi')

const mappingDataSchema = Joi.object().keys({
    payment_ref: Joi.string().required(),
    hydra: Joi.object().required(),
    orderTermsJson: Joi.object().required()
})

const TWNAddress = Joi.object().keys({
    address: Joi.string().required(),
    city: Joi.string().required(),
    zone: Joi.string().default(""),
    zip: Joi.string().max(3).required(),
})
module.exports = {
    mappingDataSchema,
    TWNAddress
}