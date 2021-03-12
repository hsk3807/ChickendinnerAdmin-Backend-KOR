const { createResponse, httpStatus, createHashHref } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const DashboardSchema = require("../schema/dashboardSchema")
const { tokenGenerator } = require("lib-utils")
const OrderHistoryService = require("../services/orderHistoryService")
const DashboardService = require("../services/dashboardService")
const MockupHelper = require("../utils/mockupHelper")
const AdapterMockupService = require("../services/adapterMockupService")

const USAGE_ORDER_HISTORY_2 = ["KOR"]

module.exports.handler = async e => {
    try {
        const { "authorization-hydra": tokenHydra} = e.headers;
        const { 
            baId,
            token,
            byPassCache = false,
            hitCouter = true,
            countryCode = null
        } = e.queryStringParameters || {};

        console.info('==GET:OrderHistory QueryStringParameters', e.queryStringParameters)

        // check args
        const { error: errorArgs } = validateInput({ tokenHydra, baId, token }, DashboardSchema.ARGS_ORDER_HISTORY);
        if (errorArgs) return createResponse(httpStatus.badRequest, { message: errorArgs.message })

        // check ba token
        if (!token) return createResponse(httpStatus.forbidden, { message: "token required." });
        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        // Mockup usage
        const isUseMockup = MockupHelper.checkUsageByBaId(baId)
        if (isUseMockup){
            const mockupData = await AdapterMockupService.getOrderHistory()
            const blendData = MockupHelper.getBlendData(mockupData)
            if (mockupData) return createResponse(httpStatus.ok, { data: JSON.stringify(blendData) })
        }

        if (countryCode && USAGE_ORDER_HISTORY_2.includes(countryCode) ){
            const orders = await DashboardService.getKrOrderHistory({
                tokenHydra,
                customerHref: createHashHref(baId, "customer"),
                params: {
                    expand: "order",
                    dateCreated: OrderHistoryService.getStatisDateCreated(),
                },
            })
            const data = JSON.stringify({ 
                apiCountryUsage: "KOR",
                cache: false, 
                orders,
            });
            return createResponse(httpStatus.ok, { data });
        }else{
            const result = await OrderHistoryService.getOrderHistoryWithCache({
                tokenHydra, 
                baId,
                requestData: JSON.stringify(e),
                byPassCache,
                hitCouter
            })
            const data = JSON.stringify(result);
            return createResponse(httpStatus.ok, { data });
        }
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}