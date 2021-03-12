const Joi = require('joi')

const GET_PARAMS = Joi.object().keys({
    baId: Joi.string().required(),
    token: Joi.string().required(),
})

module.exports = {
    GET_PARAMS,
}