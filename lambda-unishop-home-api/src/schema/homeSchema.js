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

const colorsValues = Joi.object().keys({
    english: colorSchema,
    native: colorSchema
})

const colorsOpacityValues = Joi.object().keys({
    english: Joi.object().keys({
        hex: colorSchema,
        opacity: Joi.number().min(0).max(1),
    }),
    native: Joi.object().keys({
        hex: colorSchema,
        opacity: Joi.number().min(0).max(1),
    })
})

const textValueKeys = {
    text: languagesValues.required(),
}

const urlValueKeys = {
    url: languagesValues.required()
}

const serviceItem = {
    title: Joi.object().keys(textValueKeys).required(),
    subTitle: Joi.object().keys(textValueKeys),
    image: Joi.object().keys(urlValueKeys),
}

const ADD = Joi.object().keys({
    countryCode: Joi.string().min(3).empty().uppercase().required(),
    topSection: Joi.object().keys({
        title: Joi.object().keys({
            ...textValueKeys,
            textColor: colorsValues.default({
                english: "#333",
                native: "#333"
            }),
        }).required(),
        subTitle: Joi.object().keys({
            ...textValueKeys,
            textColor: colorsValues.default({
                english: "#333",
                native: "#333"
            }),
        }).required(),
        body: Joi.object().keys({
            ...textValueKeys,
            textColor: colorsValues.default({
                english: "#333",
                native: "#333"
            }),
            backgroundColor: colorsValues.default({
                english: "#FFF",
                native: "#FFF"
            }),
        }).required(),
        button: Joi.object().keys({
            ...textValueKeys,
            textColor: colorsValues.default({
                english: "#333",
                native: "#333"
            }),
            backgroundColor: colorsValues.default({
                english: "#0DA9EF",
                native: "#0DA9EF"
            }),
            usageType: Joi.string().valid('path', 'externalLink', 'imageUrls', 'handleFunction').default("externalLink"),
            path: Joi.object().keys({
                english: Joi.string().allow("").default(""),
                native: Joi.string().allow("").default(""),
            }).default({
                english: "",
                native: "",
            }),
            externalLink: Joi.object().keys({
                english: Joi.string().uri().allow("").default(""),
                native: Joi.string().uri().allow("").default(""),
            }).default({
                english: "",
                native: "",
            }),
            externalLinkTarget: Joi.string().valid("_blank", "_self").default("_blank"),
            imageUrls: Joi.object().keys({
                english: Joi.array().items(Joi.string().uri().allow("")).default([]),
                native: Joi.array().items(Joi.string().uri().allow("")).default([]),
            }).default({
                english: [],
                native: [],
            }),
            handleFunction: Joi.object().keys({
                english: Joi.string().allow("").default(""),
                native: Joi.string().allow("").default(""),
            }).default({
                english: "",
                native: "",
            }),
        }).required(),
        backgroundImage: Joi.object().keys(urlValueKeys).required(),
        backgroundImageMobile: Joi.object().keys(urlValueKeys).required(),
        backgroundVideo: Joi.object().keys(urlValueKeys).required(),
        backgroundVideoMobile: Joi.object().keys(urlValueKeys).required(),
        backgroundVideoFilter: Joi.object().keys({ color: colorsOpacityValues }).required(),
        backgroundType: Joi.object().keys({
            english: Joi.string().valid("image", "video").default("image"),
            native: Joi.string().valid("image", "video").default("image"),
        }).default({
            english: "image",
            native: "image",
        })
    }).required(),
    serviceSection: Joi.object().keys({
        title: Joi.object().keys(textValueKeys).required(),
        subTitle: Joi.object().keys(textValueKeys).required(),
        items: Joi.array().items(serviceItem).default([]).required()
    }).required(),
    loginSection: Joi.object().keys({
        backgroundDesktop: Joi.object().keys(urlValueKeys).required(),
        backgroundTablet: Joi.object().keys(urlValueKeys).required(),
        backgroundMobile: Joi.object().keys(urlValueKeys).required(),
    }).required(),
})

module.exports = {
    ADD
}