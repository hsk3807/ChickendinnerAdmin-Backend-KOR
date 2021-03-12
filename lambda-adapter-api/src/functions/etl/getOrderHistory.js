const { createResponse, httpStatus, createHashHref } = require('../../utils/helpers')
const { validateInput } = require('../../utils/validator')
const DashboardSchema = require("../../schema/dashboardSchema")
const { tokenGenerator } = require("lib-utils")
const EtlService = require("../../services/etlService")
const EtlHelper = require("../../utils/etlHelper")
const MockupHelper = require("../../utils/mockupHelper")
const EtlAdapterMockupService = require("../../services/etlAdapterMockupService")
const DashboardService = require("../../services/dashboardService")
const OrderHistoryService = require("../../services/orderHistoryService")
const get = require('lodash.get')

const USAGE_ORDER_HISTORY_KR = ["KOR"]

module.exports.handler = async e => {
    try {
        const { "authorization-hydra": tokenHydra } = e.headers;
        const {
            baId,
            token,
            // byPassCache = false,
            hitCouter = true,
            ushopCountryCode = null,
            isMockup ,
        } = e.queryStringParameters || {};
        const byPassCache = true // force bypass cache
 
        const source_url = get(e, 'headers.referer', 'No Referer')

        console.info('==GET:OrderHistory QueryStringParameters', e.queryStringParameters)

        // check args
        const { error: errorArgs } = validateInput({ tokenHydra, baId, token }, DashboardSchema.ARGS_ORDER_HISTORY);
        if (errorArgs) return createResponse(httpStatus.badRequest, { message: errorArgs.message })

        // check ba token
        if (!token) return createResponse(httpStatus.forbidden, { message: "token required." });
        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        // Mockup usage
        const isUseMockup = MockupHelper.checkUsageByBaId(baId) || !!isMockup 
        if (isUseMockup) {
            const mockupData = await EtlAdapterMockupService.getOrderHistory()
            const blendData = MockupHelper.getBlendData(mockupData)
            if (mockupData) return createResponse(httpStatus.ok, { data: JSON.stringify({
                isMockup : !!isMockup ,
                ...blendData
            }) })
        }

        if (ushopCountryCode && USAGE_ORDER_HISTORY_KR.includes(ushopCountryCode) ){
            let result = await DashboardService.getKrOrderHistory({
                tokenHydra,
                customerHref: createHashHref(baId, "customer"),
                params: {
                    expand: "order",
                    dateCreated: OrderHistoryService.getStatisDateCreated(),
                },
            })
            const orders = {
                items: result.items
                    .reduce(EtlHelper.toDistinctOrder, [])
                    .map(EtlHelper.toEtlOrderHistoryItem)
                    .map(({ushopStatus, ...element}) => element)                
            }
            const rmas = { items: [] }
            const orders_sorted = EtlHelper.getOrderSorting([...orders.items], [...rmas.items])
            const data = JSON.stringify({
                apiCountryUsage: ushopCountryCode,
                cache: false, 
                ignoreCache: true,
                success: true,
                orders,
                rmas,
                orders_sorted,
            });
            return createResponse(httpStatus.ok, { data });
        }else{
            const result = await EtlService.getOrderHistoryWithCache({
                tokenHydra,
                baId,
                requestData: JSON.stringify(e),
                byPassCache,
                hitCouter,
                source_url
            })
            const data = JSON.stringify(result);
            return createResponse(httpStatus.ok, { data });
        }
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}