const Joi = require('joi')
const { sitesConfig } = require("lib-global-configs")
const listOfCountryCode = Object.keys(sitesConfig)
const { 
    EDIT_DATA: EDIT_INVENTORY,
    NEW_DATA: NEW_INVENTORY,
} = require("./productInventorySchema")

const ONLY_STATUS_LIST = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "H",
    "L",
    "P",
    "R",
    "S",
    "T"
]
const ALLOW_LIST = ["unipower", "shop", "enroll", "cs", "as"]

const _baseSchema = {
    country_code: Joi.string().min(3).empty().uppercase().valid(...listOfCountryCode).required(),
    item_code: Joi.string().required(),
    is_enable: Joi.boolean().optional(),
    is_archive: Joi.boolean().optional(),
    is_service_item: Joi.boolean().optional(),
    is_liquefy: Joi.boolean().optional(),
    is_renewal: Joi.boolean().optional(),
    is_renewal_sellable: Joi.boolean().optional(),
    is_starter_kit: Joi.boolean().optional(),
    is_starter_kit_sellable: Joi.boolean().optional(),
    allow: Joi.object().keys({
        unipower: Joi.boolean().optional(),
        shop: Joi.boolean().optional(),
        enroll: Joi.boolean().optional(),
        cs: Joi.boolean().optional(),
        as: Joi.boolean().optional(),
    }).optional(),
    only_status_list: Joi.array().items(Joi.string().uppercase().valid(...ONLY_STATUS_LIST)).optional(),
    enable_allowbackorder: Joi.boolean().optional(),
    product_sorting: Joi.number().allow(null).optional(),
    item_name: Joi.object().keys({
        english: Joi.string().allow('').optional(),
        native: Joi.string().allow('').optional(),
    }).optional(),
    item_info_list: Joi.object().keys({
        english: Joi.array().items(Joi.string().uri()).optional(),
        native: Joi.array().items(Joi.string().uri()).optional(),
    }).optional(),
    price: Joi.object().keys({
        wholesale: Joi.number().allow(null).optional(),
        retail: Joi.number().allow(null).optional(),
        preferred: Joi.number().allow(null).optional(),
        employee: Joi.number().allow(null).optional(),
    }).optional(),
    pv: Joi.number().allow(null).optional(),
    qty: Joi.object().keys({
        buffer: Joi.number().optional(),
    }).optional(),
    image_url: Joi.string().uri().allow(null).allow('').optional(),
    remarks: Joi.string().allow(null).allow('').optional(),
    list_of_category_id: Joi.array().items(Joi.number()).optional(),
    list_of_tag_id: Joi.array().items(Joi.number()).optional(),
}

const EDIT_DATA = Joi.object().keys({
    id: Joi.number().required(),
    ..._baseSchema,
    inventory: Joi.array().items(EDIT_INVENTORY).optional(),
})

const GET_PUBLISH = Joi.object()
    .keys({
        status: Joi.string().uppercase().valid(...ONLY_STATUS_LIST).required(),
        allow: Joi.string().lowercase().valid(...ALLOW_LIST).default(null),
        warehouse: Joi.string(),
        onlyHasPrice: Joi.number().valid(0, 1).default(1),
        onlyEnable: Joi.number().valid(0, 1).default(1),
        item_code: Joi.array().items(Joi.string()).optional(),
    })

const GET_LIST = Joi.object()
    .keys({
        country_code: Joi.string().min(3).empty().uppercase().valid(...listOfCountryCode),
        list_of_category_id: Joi.array().items(Joi.number()).default([]),
        list_of_tag_id: Joi.array().items(Joi.number()).default([]),
        is_archive: Joi.boolean().default(false),
        skip: Joi.number().default(0),
        limit: Joi.number().default(50),
    })

const EDIT_DATA_ARRAY = Joi.array().items(EDIT_DATA).min(1).required()

const NEW_DATA = Joi.object().keys({
    ..._baseSchema,
    inventory: Joi.array().items(NEW_INVENTORY).optional(),
})

module.exports = {
    GET_PUBLISH,
    GET_LIST,
    EDIT_DATA_ARRAY,
    NEW_DATA,
}