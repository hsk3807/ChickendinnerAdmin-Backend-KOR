const aws = require('aws-sdk');
const lambda = new aws.Lambda();
const DashboardService = require("./dashboardService")
const RequestCacheService = require("./requestCacheService")
const { parseBodyJSON, generateCacheId, createHashHref } = require('../utils/helpers')

const { FUNC_NAME_ORDER_HISTORY } = process.env

const getStatisDateCreated = () => {
    let begin = new Date()
    begin.setMonth(begin.getMonth() - 13)
    let end = new Date()

    begin = begin.toISOString().substring(0, 7)
    end = end.toISOString().substring(0, 7)

    return `[${begin};${end}]`
}

const getOrderHistoryWithCache = async ({
    tokenHydra,
    baId,
    requestData,
    byPassCache,
    hitCouter
}) => {
    const dateCreated = getStatisDateCreated()
    const params = {
        expand: `order,rma`,
        customer: `me|sponsoredCustomers?type=Customer`,
        dateCreated,
    }

    let isCacheUsage = false

    const tag = 'OrderHistory'
    const now = new Date().toISOString().replace("T", " ").substring(0, 22)
    const cacheId = generateCacheId({ baId })
    const customerHref = createHashHref(baId, "customer")

    let data
    let usageCounter = 0
    let minDiff

    if (byPassCache) {
        data = await DashboardService.getOrderHistory({ tokenHydra, customerHref, params })
    } else {
        const cacheData = await RequestCacheService.getById(tag, cacheId)

        if (cacheData) {
            const {
                timestamp,
                value,
                usageCounter: couter
            } = cacheData

            minDiff = Math.round(((new Date(now) - new Date(timestamp)) / 1000) / 60)
            const cacheDurationMin = 15

            if (minDiff > cacheDurationMin) {
                data = await DashboardService.getOrderHistory({ tokenHydra, customerHref, params })
            } else {
                console.info('Genealogy cache usage.')
                data = parseBodyJSON(value)
                usageCounter = hitCouter ? couter + 1 : couter
                isCacheUsage = true
            }
        } else {
            data = await DashboardService.getOrderHistory({ tokenHydra, customerHref, params })
        }
    }

    if (isCacheUsage) {
        await RequestCacheService.update(
            tag,
            cacheId,
            { usageCounter }
        )
    } else {
        await RequestCacheService.replace({
            tag,
            id: cacheId,
            timestamp: now,
            value: JSON.stringify(data),
            requestData,
            usageCounter,
            baId,
        })
    }

    data = {
        cache: isCacheUsage,
        ...data
    }

    return data
}

const invokePrepareCache = async e => {
    e.queryStringParameters.hitCouter = false
    return lambda.invoke({
        FunctionName: FUNC_NAME_ORDER_HISTORY,
        InvocationType: 'Event',
        Payload: JSON.stringify(e, null, 2),
    }).promise()
}

module.exports = {
    getOrderHistoryWithCache,
    invokePrepareCache,
    getStatisDateCreated,
}