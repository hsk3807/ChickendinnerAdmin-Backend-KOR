const Joi = require('joi');

const PATH_PARAMS = Joi.object().keys({
    baId: Joi.number().required(),
    countryCode: Joi.string().length(3).uppercase().required(),
    cartType: Joi.string().lowercase().valid("enroll", "shopping").required()
})

const CART_ITEM = Joi.object().keys({
    id: Joi.string().required(),
    qty: Joi.number().required(),
})

const BODY = Joi.array().items(Joi.object())

const SET_ITEM_ACTIONS = Joi.object().keys({
    action: Joi.string().valid("add","set")
})

module.exports = {
    PATH_PARAMS,
    BODY,
    CART_ITEM,
    SET_ITEM_ACTIONS,
}