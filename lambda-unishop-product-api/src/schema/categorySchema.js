const Joi = require('joi');

const baseSchema = {
    country_code: Joi.string().uppercase().required(),
    name: Joi.string().required(),
}

module.exports.NEW = Joi.object().keys(baseSchema)

module.exports.EDIT_SORT_LIST_CATEGORIES = Joi.array().items(
    Joi.object({
        country_code: Joi.string().uppercase().required(),
        warehouse: Joi.string().required(),
        category_name_1: Joi.string().required(),
    }).unknown()
)
