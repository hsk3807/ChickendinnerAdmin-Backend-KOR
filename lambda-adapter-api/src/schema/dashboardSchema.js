const Joi = require('joi');

module.exports.REQUIRE_QUERYSTRING = Joi
    .object()
    .keys({
        expand: Joi.string().required()
    })

module.exports.LIST_OF_EXPAND = Joi
    .array()
    .items(
        Joi.string().valid([
            "boxProfile",
            "orderHistory",
            "addressBook",
            "commission",
            "facebookLogin",
            "successTracker",
            "seminar",
            "lsb"
        ])
    );

const hydraToken = {
    tokenHydra: Joi.string().required(),
}

const customerHref = { 
    customerHref: Joi.string().required(),
}

const hydraHeader = {
    ...hydraToken,
    ...customerHref,
}

module.exports.HYDRA_TOKEN = Joi.object({
    ...hydraToken,
})

module.exports.HYDRA_HEADER = Joi.object({
    ...hydraHeader,
})


module.exports.BOX_PROFILE = Joi.object({
    ...hydraHeader,
    expandBoxProfile: Joi.string(),
})

module.exports.ORDER_HISTORY = Joi.object({
    ...hydraHeader,
    expandOrderHistory: Joi.string(),
    dateCreated: Joi.string(),
    customer: Joi.string(),
})

module.exports.SUCCESS_TRACKER = Joi.object({
    ...hydraHeader,
    expandSuccessTracker: Joi.string(),
})

module.exports.SEMINAR = Joi.object({
    baId : Joi.string().required(), 
    tokenUshop : Joi.string().required(), 
    country_code : Joi.string().uppercase().required(),
})

module.exports.LSB = Joi.object({
    baId : Joi.string().required()
})

module.exports.GENEALOGY = Joi.object({
    tokenHydra: Joi.string().required(),
    baId : Joi.string().required(),
})

module.exports.PARAMS_DASHBOARD2 = Joi.object()
    .keys({
        tokenHydra: Joi.string().required(),
        tokenUshop: Joi.string().required(),
        baId: Joi.string().required(),
        countryCode: Joi.string().uppercase().required(),
    })

module.exports.ARGS_ONSELF = Joi.object()
    .keys({
        tokenHydra: Joi.string().required(),
        baId: Joi.string().required(),
        token: Joi.string().required(),
    })

module.exports.ARGS_ORDER_HISTORY = Joi.object()
    .keys({
        tokenHydra: Joi.string().required(),
        baId: Joi.string().required(),
        token: Joi.string().required(),
    })