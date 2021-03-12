const Joi = require('joi');

const colorSchema = Joi.string()
    .uppercase()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)

const languagesValues = Joi.object().keys({
    english: Joi.string().allow("").default(""),
    native: Joi.string().allow("").default("")
}).default({
    english: "",
    native: ""
})

const textValueKeys = {
    text: languagesValues.required(),
}

const urlValueKeys = {
    url: languagesValues.required()
}

const serviceItem = {
    title : Joi.object().keys(textValueKeys).required(),
    subTitle : Joi.object().keys(textValueKeys),
    image: Joi.object().keys(urlValueKeys),
}

const ADD = Joi.object().keys({
    payload: Joi.object().required(),
    expire: Joi.date().iso().allow(null).default(null),
})

module.exports = {
    ADD
}