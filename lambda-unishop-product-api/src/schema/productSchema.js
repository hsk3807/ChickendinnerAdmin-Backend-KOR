const Joi = require('joi');

const baseSchema = {
    country_code: Joi.string().uppercase().required(),
    warehouse: Joi.string().allow("").required(),
    item_code: Joi.string().allow("").required(),
    category_name_1: Joi.string().allow("").allow(null).default(""),
    category_name_2: Joi.string().allow("").allow(null).default(""),
    item_name_1: Joi.string().allow("").allow(null).default(""),
    item_name_2: Joi.string().allow("").allow(null).default(""),
    item_desc_1: Joi.string().allow("").allow(null).default(""),
    item_desc_2: Joi.string().allow("").allow(null).default(""),
    item_feature_1: Joi.string().allow("").allow(null).default(""),
    item_feature_2: Joi.string().allow("").allow(null).default(""),
    wholesale_price: Joi.string().allow("").allow(null).default("0"),
    retail_price: Joi.string().allow("").allow(null).default("0"),
    preferred_price: Joi.string().allow("").allow(null).default("0"),
    employee_price: Joi.string().allow("").allow(null).default("0"),
    sorted: Joi.string().default("999"),
    pv: Joi.string().allow("").allow(null).default("0"),
    qty: Joi.string().allow("").allow(null).default("0"),
    qty_purchased: Joi.number().allow(null),
    qty_limited: Joi.number().allow(null),
    allow_backorder: Joi.string().allow("").allow(null).default("0"),
    hot: Joi.string().allow("").allow(null).default("0"),
    image_url: Joi.string().allow("").allow(null).default(""),
    hd_image_url: Joi.string().allow("").allow(null).default(""),
    video_url: Joi.string().allow("").allow(null).default(""),
    link: Joi.string().allow("").allow(null).default(""),
    link2: Joi.string().allow("").allow(null).default(""),
    link_list: Joi.array().items(Joi.string()).default([]),
    link_list2: Joi.array().items(Joi.string()).default([]),
    status: Joi.string().allow("").allow(null).default("0"),
    remarks: Joi.string().allow("").allow(null).default(""),
    buffer_qty: Joi.string().allow("").allow(null).default(""),
    featured: Joi.string().allow("").allow(null).default("0"),
    nutrition: Joi.string().allow("").allow(null).default(""),
    category_sorted: Joi.string().allow("").allow(null).default(null),
}

module.exports.NEW = Joi.object().keys(baseSchema)

module.exports.EDIT = Joi.object().keys({
    id: Joi.number().required(),
    ...baseSchema,
})

module.exports.EDIT_MULTI_HOT = Joi.array().items(
    Joi.object().keys({
        id: Joi.number().required(),
        hot: Joi.string().allow("0").allow("1").default("0"),
    })
)

module.exports.EDIT_MULTI_FEATURED = Joi.array().items(
    Joi.object().keys({
        id: Joi.number().required(),
        featured: Joi.string().allow("0").allow("1").default("0"),
    })
)

module.exports.EDIT_MULTI_ALLOW_BACKORDER = Joi.array().items(
    Joi.object().keys({
        id: Joi.number().required(),
        allow_backorder: Joi.string().allow("0").allow("1").default("0"),
    })
)

module.exports.EDIT_MULTI_BUFFER_QUANTITY = Joi.array().items(
    Joi.object().keys({
        id: Joi.number().required(),
        buffer_qty: Joi.number().required(),
    })
)

module.exports.EDIT_MULTI_STATUS = Joi.array().items(
    Joi.object().keys({
        id: Joi.number().required(),
        status: Joi.string().required().valid("0", "1"),
    })
)

module.exports.getEditSortListSchemaByBody = body => Joi
    .object(Object.keys(body).reduce((obj, groupkey) => {
        obj[groupkey] = Joi.array().items(
            Joi.object({
                country_code: Joi.string().uppercase().required(),
                warehouse: Joi.string().required(),
                item_code: Joi.string().required().allow(""),
            }).unknown()
        )
        return obj
    }, {}))