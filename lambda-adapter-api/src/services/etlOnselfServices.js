const aws = require('aws-sdk');
const lambda = new aws.Lambda()
const RequestCacheService = require("./requestCacheService")
const { parseBodyJSON, generateCacheId, createHashHref } = require('../utils/helpers')
const etlDashboardService = require("./etlDashboardService")

const { FUNC_NAME_ETL_ONSELF, CACHE_REQUEST_MIN } = process.env

const getLsbCommission = async ({ tokenHydra, baId, source_url }) => {
    const customerHref = createHashHref(baId, 'customer')

    const resCommission = etlDashboardService.getCommission({ tokenHydra, customerHref, source_url })
    const resLsb = etlDashboardService.getLsb({ baId })
    const resProfile = etlDashboardService.getBoxProfile({
        tokenHydra,
        customerHref,
        params: { expand: `metricsProfileHistory,profilePicture` },
        source_url
    })

    const resProcesses = await Promise.allSettled([resCommission, resLsb, resProfile])

    const errorProcesses = resProcesses.filter(({ status }) => status === 'rejected').map(({ reason }) => reason)
    if (errorProcesses.length > 0) throw { message: "Error external api.", ...errorProcesses }

    const [commission, lsb, profile] = resProcesses.map(({ value }) => value)
    return { lsb, commission, profile }
}

const getData = async ({
    tokenHydra,
    baId,
    byPassCache,
    requestData,
    hitCouter,
    source_url
}) => {
    let isCacheUsage = false

    const tag = 'etl/Onself'
    const now = new Date().toISOString().replace("T", " ").substring(0, 22)
    const cacheId = generateCacheId({ baId })

    let data
    let usageCounter = 0
    let minDiff

    if (byPassCache) {
        data = await getLsbCommission({ tokenHydra, baId, source_url })
    } else {
        const cacheData = await RequestCacheService.getById(tag, cacheId)

        if (cacheData) {
            const {
                timestamp,
                value,
                usageCounter: couter
            } = cacheData

            minDiff = Math.round(((new Date(now) - new Date(timestamp)) / 1000) / 60)

            const cacheDurationMin = parseInt(CACHE_REQUEST_MIN)

            if (minDiff > cacheDurationMin) {
                data = await getLsbCommission({ tokenHydra, baId, source_url })
            } else {
                console.info(`${tag} cache usage.`)
                data = parseBodyJSON(value)
                usageCounter = hitCouter ? couter + 1 : couter
                isCacheUsage = true
            }

        } else {
            data = await getLsbCommission({ tokenHydra, baId, source_url })
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

const getDataIgnoreCache = async ({
    tokenHydra,
    baId,
    source_url
}) => {
    const result = await getLsbCommission({ tokenHydra, baId, source_url })
    data = {
        cache: false,
        isIgnoreCache: true,
        ...result
    }
    return data
}

const invokePrepareCache = async e => {
    e.queryStringParameters.hitCouter = false
    return lambda.invoke({
        FunctionName: FUNC_NAME_ETL_ONSELF,
        InvocationType: 'Event',
        Payload: JSON.stringify(e, null, 2),
    }).promise()
}

module.exports = {
    getLsbCommission,
    getData,
    invokePrepareCache,
    getDataIgnoreCache,
}