const axios = require('axios')
const aws = require('aws-sdk');
const getCountryISO3 = require("country-iso-2-to-3");
const lambda = new aws.Lambda();
const { API_URLS } = require('./configs')
const { convertToQueryString, parseBodyJSON, generateCacheId } = require('../utils/helpers')
const RequestCacheService = require('./requestCacheService')
const Helpers = require('../utils/helpers')
const {
    CACHE_REQUEST_MIN,
    FUNC_NAME_GENEALOGY,
} = process.env
const DashboardService = require('./dashboardService')

const getStatisDateCreated = () => {
    let begin = new Date()
    begin.setMonth(begin.getMonth() - 5)
    let end = new Date()

    begin = begin.toISOString().substring(0, 7)
    end = end.toISOString().substring(0, 7)

    return `[${begin};${end}]`
}

const getGenealogy = async (tokenHydra, customerHref, params) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/sponsoredCustomersTreePreOrder${convertToQueryString(params)}`
    console.time(url)
    const options = {
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    }
    const { data } = await axios(options)
    delete data.favorites
    console.timeEnd(url)
    return data
}

const getGenealogyWithCombineOthers = async (
    tokenHydra,
    customerHref,
    baId,
    params,
    disableOptions,
    ushopCountry,
) => {
    try {
        const enableOptions = {
            genealogy: disableOptions ? !disableOptions.genealogy : true,
            achievementsHistory: disableOptions ? !disableOptions.achievementsHistory : true,
            seminar: disableOptions ? !disableOptions.seminar : true,
            orderHistory: disableOptions ? !disableOptions.orderHistory : true,
        }

        const reqAchievementsHistory = enableOptions.achievementsHistory
            ? DashboardService.getSuccessTracker({
                tokenHydra,
                customerHref,
                params: { expand: 'metrics' }
            })
            : null

        const reqOrderHistory = enableOptions.orderHistory
            ? DashboardService.getOrderHistory({
                tokenHydra,
                customerHref,
                params: {
                    expand: `order,rma`,
                    customer: `me|sponsoredCustomers?type=Customer`,
                    dateCreated: getStatisDateCreated(),
                }
            })
            : null

        const genealogy = enableOptions.genealogy
            ? await getGenealogy(tokenHydra, customerHref, params)
            : null

        // let reqSeminar = null
        // if (genealogy && enableOptions.seminar) {
        //     // const { items } = genealogy || {}
        //     // const [firstItem] = items || []
        //     // const { customer } = firstItem || {}
        //     // const { mainAddress } = customer || {}
        //     // const { country } = mainAddress || {}
        //     // const countryCode = getCountryISO3(country)

        //     reqSeminar = DashboardService.getSeminar({
        //         baId,
        //         params: { country_code: ushopCountry },
        //         // params: { country_code: countryCode },
        //     })
        // }

        const requestsProcesses = await Promise.allSettled([
            reqAchievementsHistory,
            reqOrderHistory,
            // reqSeminar,
        ])

        const errorProcesses = requestsProcesses
            .filter(({ status }) => status === 'rejected')
            .map(({ reason }) => reason)
        if (errorProcesses.length > 0) throw errorProcesses

        const [
            achievementsHistory, 
            orderHistory,
            // seminar,
        ] = requestsProcesses.map(({ value }) => value)
        return {
            genealogy,
            achievementsHistory,
            // seminar,
            orderHistory,
        }
    } catch (err) {
        console.error(err)
        throw err
    }
}

const getWithCatchGenealogy = async (
    tokenHydra,
    baId,
    params,
    byPassCache = false,
    requestData,
    hitCouter,
    isSaveCache = true,
    disableOptions,
    ushopCountry,
) => {
    try {

        let isCacheUsage = false

        const tag = 'Genealogy'
        const now = new Date().toISOString().replace("T", " ").substring(0, 22)
        const cacheId = generateCacheId({ baId })
        const customerHref = Helpers.createHashHref(baId, "customer")

        let data
        let usageCounter = 0
        let minDiff

        if (byPassCache) {
            data = await getGenealogyWithCombineOthers(tokenHydra, customerHref, baId, params, disableOptions, ushopCountry)
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
                    data = await getGenealogyWithCombineOthers(tokenHydra, customerHref, baId, params, disableOptions, ushopCountry)
                } else {
                    console.info('Genealogy cache usage.')
                    data = parseBodyJSON(value)
                    usageCounter = hitCouter ? couter + 1 : couter
                    isCacheUsage = true
                }
            } else {
                data = await getGenealogyWithCombineOthers(tokenHydra, customerHref, baId, params, disableOptions, ushopCountry)
            }
        }

        if (isSaveCache) {
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
        }

        const seminar = await DashboardService.getSeminar({
            baId,
            params: { country_code: ushopCountry },
        })

        data = {
            cache: isCacheUsage,
            age: isCacheUsage
                ? minDiff > 20 ? 3 : minDiff > 10 ? 2 : 1
                : minDiff > 720 ? 0 : 99,
            ...data,
            seminar: {
                cache: false,
                ...seminar,
            },
        }
        return data
    } catch (err) {
        console.error(err)
        throw err
    }

}

const invokePrepareCache = async e => {
    return lambda.invoke({
        FunctionName: FUNC_NAME_GENEALOGY,
        InvocationType: 'Event',
        Payload: JSON.stringify(e, null, 2),
    }).promise()
}

module.exports = {
    getGenealogy,
    getWithCatchGenealogy,
    invokePrepareCache,
}