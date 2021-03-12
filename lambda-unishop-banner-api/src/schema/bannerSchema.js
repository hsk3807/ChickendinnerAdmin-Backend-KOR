const Joi = require('joi');
const {
    textContentSchema,
    urlContentSchema,
    languageCodeSchema,
    colorSchema,
    opacityColorSchema,
    alignDeviceSchema,
    arrayTextContentSchema,
} = require('./generalSchema')

var JoiEmptyToNull = Joi.extend({
    base: Joi.string().allow(null),
    name: 'string',
    coerce: (value, state, options) => value === "" ? null : value,
});

const defauleTextContent = { "EN": null }

const validateTextContent = Joi.object()
    .keys({
        text: textContentSchema.default(defauleTextContent),
        color: colorSchema.default("#FFF"),
        align: alignDeviceSchema.default({
            desktop: "middleRight",
            mobile: "middleRight",
        }),
    }).default({
        text: defauleTextContent,
        color: "#FFF",
        align: {
            desktop: "middleRight",
            mobile: "middleRight",
        },
    })

const defaultArrayTextContent = {
    EN: [],
}

const baseSchema = {
    countryCode: Joi.string().uppercase().required(),
    isActive: Joi.boolean().default(false),
    publishDate: Joi.object()
        .keys({
            begin: JoiEmptyToNull.string().allow(''),
            end: JoiEmptyToNull.string().allow('')
        }),
    displayLanguage: Joi.array()
        .items(languageCodeSchema.required())
        .default(["EN"]),
    title: validateTextContent,
    body: validateTextContent,
    button: Joi.object()
        .keys({
            text: textContentSchema.default(defauleTextContent),
            align: alignDeviceSchema.default({
                desktop: "middleRight",
                mobile: "middleRight",
            }),
            color: colorSchema.default("#FFFFFF"),
            bgColor: colorSchema.default("#FB8C00"),
            link: urlContentSchema.default(defauleTextContent),
            openNewWindow: Joi.boolean().default(false),
        })
        .default({
            text: defauleTextContent,
            align: alignDeviceSchema.default({
                desktop: "middleRight",
                mobile: "middleRight",
            }),
            color: "#FFFFFF",
            bgColor: "#FB8C00"
        }),
    foreground: Joi.object()
        .keys({
            imageUrl: urlContentSchema.default(defauleTextContent),
            align: alignDeviceSchema.default({
                desktop: "middleLeft",
                mobile: "middleLeft",
            })
        })
        .default({
            imageUrl: defauleTextContent,
            align: {
                desktop: "middleLeft",
                mobile: "middleLeft",
            }
        }),
    background: Joi.object()
        .keys({
            desktopImageUrl: urlContentSchema.default(defauleTextContent),
            mobileImageUrl: urlContentSchema.default(defauleTextContent),
            link: urlContentSchema.default(defauleTextContent),
            openNewWindow: Joi.boolean().default(false),
            usageType: Joi.string().valid('path', 'externalLink', 'imageUrls', 'handleFunction').default("externalLink"),
            path: textContentSchema.default(defauleTextContent),
            externalLink: urlContentSchema.default(defauleTextContent),
            externalLinkTarget: Joi.string().valid("_blank", "_self").default("_blank"),
            imageUrls: arrayTextContentSchema.default(defaultArrayTextContent),
            handleFunction: textContentSchema.default(defauleTextContent),
        }),
    arrows: Joi.object()
        .keys({
            previousColor: opacityColorSchema.default({
                hex: "#FFFFFF",
                opacity: 0.75,
            }),
            nextColor: opacityColorSchema.default({
                hex: "#FFFFFF",
                opacity: 0.75,
            }),
        })
        .default({
            previousColor: {
                hex: "#FFFFFF",
                opacity: 0.75,
            },
            nextColor: {
                hex: "#FFFFFF",
                opacity: 0.75,
            },
        }),

}

module.exports.SPECIFIC = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    id: Joi.string().required()
})

module.exports.ADD = Joi.object().keys({
    ...baseSchema
})

module.exports.EDIT = Joi.object().keys({
    id: Joi.string().required(),
    ...baseSchema
})

module.exports.EDIT_ACTIVE = Joi.object().keys({
    isActive: Joi.boolean().required(),
})

module.exports.REMOVE = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    id: Joi.string().required()
})

module.exports.COUNTRY_CODE = Joi.object().keys({
    countryCode: Joi.string().uppercase().required()
})

module.exports.GET = Joi.object().keys({
    countryCode: Joi.string().uppercase().required(),
    id: Joi.string().required()
})

module.exports.PARAMS_SORT_BY_ID = Joi.object().keys({
    countryCode: Joi.string().uppercase().required()
})

module.exports.ARRAY_STRING = Joi.array().items(Joi.string().required()).required()

module.exports.MULTIPLE_ENABLE = Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            isActive: Joi.boolean().required(),
        })
    ).min(1)
