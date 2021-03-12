const Joi = require('joi');

const JoiEmptyToNull = Joi.extend({
    base: Joi.string().allow(null),
    name: 'string',
    coerce: (value, state, options) => value === "" ? null : value,
});

module.exports.LOGIN = Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required()
})


module.exports.USERNAME = Joi.object().keys({
    username: Joi.string().required()
})


module.exports.getEditUserProfileSchema = countryList => Joi.object({
    settings: Joi.object({
        defaultCountry: Joi.string().uppercase().allow(null).default(null),
        countries: Joi.object(countryList.reduce((obj, countryCode) => {
            obj[countryCode] = Joi.object({
                defaultLanguage: Joi.string().uppercase().length(2).allow(null).default(null),
                defaultMenu: Joi.string().allow(null).default(null),
                defaultWarehouse: Joi.string().allow(null).default(null),
            })
            return obj
        }, {}))
    })
})