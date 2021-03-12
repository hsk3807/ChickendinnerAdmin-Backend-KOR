const { parseBodyJSON, generateCacheId, createHashHref, convertToQueryString } = require('../utils/helpers')
const DashboardService = require("../services/dashboardService")
const RequestCacheService = require("../services/requestCacheService")
const { API_URLS } = require('./configs')
const axios = require('axios')
const deepEqual = require('fast-deep-equal')
const curlirize = require('axios-curlirize')
const { saveLog } = require('../utils/saveLog')
const EtlHelper = require("../utils/etlHelper")
const get = require('lodash.get')

curlirize(axios);

const { CACHE_REQUEST_MIN: cacheRequestMin } = process.env

const formUrlEncoded = x =>
    Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

const f = obj => [
    `{`,
    Object.keys(obj).reduce((lines, key) => [...lines, `\t\"${key}\": \"${obj[key]}\"`], []).join(`,\n`),
    `}`
].join(`\n`)

const getCustomer = async ({ tokenHydra, params }) => {
    const url = `${API_URLS.HYDRA}/customers${convertToQueryString(params)}`
    console.time(url)
    const { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
    console.timeEnd(url)
    return data
}

const getBoxProfile = async ({ tokenHydra, customerHref, params }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/${convertToQueryString(params)}`
    console.time(url)
    const { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
    console.timeEnd(url)
    let result = {
        ...(data.mainAddress 
            ? {
                mainAddress: {
                    country: data.mainAddress.country
                },
            } 
            : {}),
        id: {
            unicity: data.id.unicity
        },
        joinDate: data.joinDate,
        metricsProfileHistory: {
            items: [...data.metricsProfileHistory.items]
        },
        profilePicture: {
            sizes: [...data.profilePicture.sizes]
        },
        status: data.status,
        type: data.type,
        email: data.email,
        sponsor: {
            ...data.sponsor,
        },
        enroller: {
            ...data.enroller
        },
        cumulativeMetricsProfile: {
            ...data.cumulativeMetricsProfile
        },
        humanName: {
            ...data.humanName
        },
        unicity: data.unicity,
        achievementHistory: {
            ...data.achievementHistory
        },
    }

    delete result.humanName.firstName
    delete result.humanName.lastName

    return result
}

const getAddressBook = async ({ customerHref, tokenHydra }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/shiptooptions`
    console.time(url)
    const { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
    console.timeEnd(url)
    return data

}

const getCommission = async ({ tokenHydra, customerHref }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/commissionstatements`
    console.time(url)
    const { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
    console.timeEnd(url)
    return data
}

const getFacebookLogin = async ({ customerHref, tokenHydra }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/loginassociations`
    console.time(url)
    const { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
    console.timeEnd(url)
    return data
}

const getSuccessTrackerMoreItems = async ({ customerHref, tokenHydra, periodBegin, periodEnd }) => {
    const beginDate = new Date(periodBegin.getFullYear(), periodBegin.getMonth())
    const endDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth())
    const currentDate = beginDate

    const reqProcess = []
    do {
        const period = currentDate.toISOString().substring(0, 7)
        const params = { expand: "metrics", period }
        const url = `${API_URLS.HYDRA}/customers/${customerHref}/achievementsHistory${convertToQueryString(params)}`
        reqProcess.push(axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        }))
        currentDate.setMonth(currentDate.getMonth() + 1)
    } while (currentDate <= endDate)

    const resResults = await Promise.allSettled(reqProcess)
    const moreItems = resResults
        .filter(r => r.status === "fulfilled")
        .reduce((list, r) => {
            const { value } = r || {}
            const { data } = value || {}
            const { items = [] } = data || {}

            return [...list, ...items]
        }, [])

    return moreItems
}

const getSuccessTracker = async ({ customerHref, tokenHydra, params, source_url }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/achievementsHistory${convertToQueryString(params)}`
    console.time(url)
    try {
        const now = new Date()
        const periodBegin = new Date(now.getFullYear(), now.getMonth())
        const periodEnd = new Date(now.getFullYear(), now.getMonth())
        periodBegin.setMonth(periodBegin.getMonth() - 5)
        periodEnd.setMonth(periodEnd.getMonth() - 4)

        const [res, moreItems] = await Promise.all([
            axios({
                method: `get`,
                url,
                headers: {
                    authorization: tokenHydra
                }
            }),
            getSuccessTrackerMoreItems({ customerHref, tokenHydra, periodBegin, periodEnd })
        ])

        let response = res || {}
        let { items = [] } = response.data || {}

        let message = {
            uuid: response.headers['x-request-uuid'],
            time: response.headers.date,
            curl: response.config.curlCommand
        }

        let curl_mock = message.curl
        let string = ''

        for (let i = 0; i < curl_mock.length; i++) {
            if (curl_mock.charAt(i) === '[') {
                string += '\\' + curl_mock.charAt(i)
                continue
            } else if (curl_mock.charAt(i) === ']') {
                string += '\\' + curl_mock.charAt(i)
                continue
            }
            string += curl_mock.charAt(i)
        }

        message.curl = string
        let data_ = {
            href: response.data.href,
            items: []
        }

        let resLog
        try {
            resLog = await saveLog(f(message), JSON.stringify(res.data), url)
        } catch (e) {
            resLog = {
                data: {
                    id: e.message
                }
            }
        }
        const log_id = resLog.data.id

        response.data.items = [...items, ...moreItems]
            .sort((r1, r2) => r1.period > r2.period ? -1 : r1.period < r2.period ? 1 : 0)
            .reduce((list, r) => {
                const foundItem = list.find(it => it.period === r.period)
                return foundItem ? list : [...list, r]
            }, [])
            .map(r => {
                const { value = [] } = r || {};
                const defaultRank = value.reduce((lastRank, v) => {
                    const {
                        metrics,
                        achievement = {},
                    } = v || {}
                    const { rankShort } = achievement

                    const filterMetrics = Array.isArray(metrics)
                        ? metrics.filter(({ name }) => [
                            "ov_apt1",
                            "ov_leg1",
                            "ov_leg2",
                            "ov_leg3hc_pv_excluded"
                        ].includes(name))
                        : []

                    const isQualified = Array.isArray(metrics)
                        ? filterMetrics.length > 0
                            ? filterMetrics.findIndex(({ qualified }) => qualified === false) < 0
                            : true
                        : false

                    let rankShortLast = lastRank
                    if (typeof lastRank === "object") {
                        const { achievement: achievementLastRank } = lastRank || {}
                        const { rankShort: lastRankShort } = achievementLastRank || {}
                        rankShortLast = lastRankShort
                    }
                    return isQualified ? rankShort : rankShortLast
                })

                return { ...r, defaultRank: defaultRank ? defaultRank : "Mgr" }
            })

        console.timeEnd(url)


        let result = {
            ...response.data,
            log_id: log_id,
            success: true
        }
        return result
    } catch (e) {
        let message = {
            uuid: "",
            time: new Date(),
            curl: get(e, 'config.curlCommand', 'error not api')
        }

        let curl_mock = message.curl
        let string = ''

        for (let i = 0; i < curl_mock.length; i++) {
            if (curl_mock.charAt(i) === '[') {
                string += '\\' + curl_mock.charAt(i)
                continue
            } else if (curl_mock.charAt(i) === ']') {
                string += '\\' + curl_mock.charAt(i)
                continue
            }
            string += curl_mock.charAt(i)
        }

        message.curl = string
        let data = {
            message: e.message,
            url: url,
        }

        let resLog = await saveLog(f(message), JSON.stringify(data), url)
        const log_id = resLog.data.id
        let result = {
            success: false,
            log_id: log_id,
            message: e.message
        }
        return result
    }
}

const getSeminar = async ({ baId, tokenUshop, params }) => { //use
    const url = `https://member-calls2.unicity.com/unishop-fn-misc/seminar/v2/get/${baId}${convertToQueryString(params)}`
    console.time(url)
    let { data } = await axios({
        method: `get`,
        url,
    })
    console.timeEnd(url)

    let item_filter = data.data.map(EtlHelper.toEtlSeminarItem)
    data.data = item_filter

    return data
}

const getLsb = async ({ baId }) => {
    const url = `https://member-calls.unicity.com/api/unishop/v1/common/global/LBS`

    console.time(url)
    const { data } = await axios({
        method: `post`,
        url,
        data: formUrlEncoded({ dist_id: baId }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    console.timeEnd(url)

    return data
}

const getWithCatch = async (
    tag,
    cacheId,
    func,
    args,
    byPassCache = false,
) => {
    let data
    let isUpdateCache = false

    const now = new Date().toISOString().replace("T", " ").substring(0, 22)

    if (byPassCache) {
        data = await func(args)
        isUpdateCache = true
    } else {
        const cacheData = await RequestCacheService.getById(tag, cacheId)

        if (cacheData) {
            const { timestamp, value } = cacheData
            const minDiff = ((new Date(now) - new Date(timestamp)) / 1000) / 60

            if (minDiff > cacheRequestMin) {
                data = await func(args)
                isUpdateCache = true
            } else {
                console.info(tag, 'use cache.')
                data = parseBodyJSON(value)
            }
        } else {
            data = await func(args)
            isUpdateCache = true
        }
    }

    if (isUpdateCache) {
        await RequestCacheService.replace({
            tag,
            id: cacheId,
            timestamp: now,
            value: JSON.stringify(data)
        })
    }

    return data
}

const getBoxProfileWithCatch = async ({ baId, params, byPassCache = false }) => {
    return getWithCatch(
        'BoxProfile',
        baId,
        getBoxProfile,
        { baId, params },
        byPassCache
    )
}

const getOrderHistoryWithCatch = async ({ customerHref, tokenHydra, params, byPassCache = false }) => {
    const {
        expand,
        dateCreated,
        customer,
    } = params || {}

    const cacheId = [
        customerHref,
        expand,
        dateCreated,
        customer
    ].join("_")

    return getWithCatch(
        'OrderHistory',
        cacheId,
        getOrderHistory,
        { customerHref, tokenHydra, params },
        byPassCache
    )
}

const getAddressBookWithCache = async ({ customerHref, tokenHydra, byPassCache = false }) => {
    return getWithCatch(
        'AddressBook',
        customerHref,
        getAddressBook,
        { customerHref, tokenHydra },
        byPassCache
    )
}

const getCommissionWithCache = async ({ tokenHydra, customerHref, baId, byPassCache = false }) => {
    const cacheId = baId || customerHref
    return cacheId
        ? getWithCatch(
            'Commission',
            cacheId,
            getCommission,
            { customerHref, tokenHydra },
            byPassCache
        )
        : getCommission({ tokenHydra })
}

const getFacebookLoginWithCache = async ({ customerHref, tokenHydra, byPassCache = false }) => {
    return getWithCatch(
        'FacebookLogin',
        customerHref,
        getFacebookLogin,
        { customerHref, tokenHydra },
        byPassCache
    )
}

const getSuccessTrackerWithCache = async ({ customerHref, tokenHydra, params, byPassCache = false }) => {
    const {
        expand,
    } = params || {}

    const cacheId = [
        customerHref,
        expand,
    ].join("_")

    return getWithCatch(
        'SuccessTracker',
        cacheId,
        getSuccessTracker,
        { customerHref, tokenHydra, params },
        byPassCache
    )
}


const getStatisDateCreated = () => {
    let begin = new Date()
    begin.setMonth(begin.getMonth() - 13)
    let end = new Date()

    begin = begin.toISOString().substring(0, 7)
    end = end.toISOString().substring(0, 7)

    return `[${begin};${end}]`
}

const getOrderHistoryByDashboard = async ({ 
    customerHref, 
    tokenHydra, 
    params, 
    source_url,
    orderType = "ordersAndRmas", // [ordersAndRmas, orders]
}) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/${orderType}${convertToQueryString(params)}`
    
    try {
        console.time(url)
        let res = await axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        })
        console.timeEnd(url)

        // convert orders response like rmas response
        if (orderType === "orders"){
            res.data = {
                orders: {
                    items: res.data.items.map(r => {
                        return {
                            ...r,
                            ...(r.customer && r.customer.humanName ? {} : {customer: { humanName: r.shipToName }}) // if r.customer.humanName not exists replace with shipToName
                        }
                    }),
                },
                rmas: { items: [] }
            }
        }

        let message = {
            uuid: res.headers['x-request-uuid'],
            time: res.headers.date,
            curl: res.config.curlCommand
        }

        let curl_mock = message.curl
        let string = ''

        for (let i = 0; i < curl_mock.length; i++) {
            if (curl_mock.charAt(i) === '[') {
                string += '\\' + curl_mock.charAt(i)
                continue
            } else if (curl_mock.charAt(i) === ']') {
                string += '\\' + curl_mock.charAt(i)
                continue
            }
            string += curl_mock.charAt(i)
        }

        message.curl = string
        let resLog
        try {
            resLog = await saveLog(f(message), JSON.stringify(res.data), url)
        } catch (e) {
            resLog = {
                data: {
                    id: e.message
                }
            }
        }
        const log_id = resLog.data.id

        res.data.orders.items = res.data.orders.items.map((element) => {
            let etlStatus
            if (element.fulfillmentStatus === 'Fulfilled') {
                etlStatus = 4
            } else if (element.fulfillmentStatus === 'UnFulfilled') {
                etlStatus = 2
            } else {
                etlStatus = 1
            }
            return {
                ...element,
                ushopStatus: etlStatus
            }
        })

        res.data.rmas.items = res.data.rmas.items.map((element) => {
            let etlStatus
            if (element.fulfillmentStatus === 'Fulfilled') {
                etlStatus = 4
            } else if (element.fulfillmentStatus === 'UnFulfilled') {
                etlStatus = 2
            } else {
                etlStatus = 1
            }
            return {
                ...element,
                ushopStatus: etlStatus
            }
        })

        res.data.orders.items.reverse()
        res.data.rmas.items.reverse()
        // Distinct Items
        let result = {
            ...res.data,
            log_id: log_id,
            success: true
        }
        if (result && result.orders && Array.isArray(result.orders.items)) {
            result.orders.items = result.orders.items.reduce((list, r) => {
                const { currency, ...compare } = r
                const foundItem = list.find(({ currency, ...it }) => deepEqual(it, compare))
                return foundItem ? list : [...list, r]
            }, [])
        }
        return result
    } catch (e) {
        console.error(e)
        let message = {
            uuid: "",
            time: new Date(),
            curl: get(e, 'config.curlCommand', 'error not api')
        }

        let curl_mock = message.curl
        let string = ''

        for (let i = 0; i < curl_mock.length; i++) {
            if (curl_mock.charAt(i) === '[') {
                string += '\\' + curl_mock.charAt(i)
                continue
            } else if (curl_mock.charAt(i) === ']') {
                string += '\\' + curl_mock.charAt(i)
                continue
            }
            string += curl_mock.charAt(i)
        }

        message.curl = string
        let data = {
            message: e.message,
            url: url,
        }

        let resLog = await saveLog(f(message), JSON.stringify(data), url)
        const log_id = resLog.data.id
        let result = {
            success: false,
            log_id: log_id,
            message: e.message
        }
        return result
    }
}

const getOrderHistoryFromHydra = async ({ 
    customerHref, 
    tokenHydra, 
    params, 
    orderType = "ordersAndRmas",  // <<< [ordersAndRmas, orders]
}) => { //use
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/${orderType}${convertToQueryString(params)}`
    console.time(url)

    try {
        let res = await axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        })
        console.timeEnd(url)

        let message = {
            uuid: res.headers['x-request-uuid'],
            time: res.headers.date,
            curl: res.config.curlCommand
        }

        let curl_mock = message.curl
        let string = ''

        for (let i = 0; i < curl_mock.length; i++) {
            if (curl_mock.charAt(i) === '[') {
                string += '\\' + curl_mock.charAt(i)
                continue
            } else if (curl_mock.charAt(i) === ']') {
                string += '\\' + curl_mock.charAt(i)
                continue
            }
            string += curl_mock.charAt(i)
        }

        message.curl = string


        let resLog
        try {
            resLog = await saveLog(f(message), JSON.stringify(res.data), url)
        } catch (e) {
            resLog = {
                data: {
                    id: e.message
                }
            }
        }
        const log_id = resLog.data.id
        // let items = []
        // let items_rmas = []
        // let newData = dataOrigin.map((r, index) => ({ id: r.id, sorting: index + 1 }))
        let items = (orderType === "ordersAndRmas" ? res.data.orders.items : res.data.items)
            .reduce(EtlHelper.toDistinctOrder, [])
            .map(EtlHelper.toEtlOrderHistoryItem);
        let items_rmas = (orderType === "ordersAndRmas" ? res.data.rmas.items : [])
            .reduce(EtlHelper.toDistinctOrder, [])
            .map(EtlHelper.toEtlOrderHistoryItem).reverse()
        let orders_sorting = EtlHelper.getOrderSorting(items, items_rmas)

        items_rmas = items_rmas.map((element) => {
            delete element.ushopStatus
            return {
                ...element
            }
        })

        items = items.map((element) => {
            delete element.ushopStatus
            return {
                ...element
            }
        })

        let result = {
            log_id: log_id,
            success: true,
            orderType,
            orders: {
                items: items
            },
            rmas: {
                items: items_rmas
            },
            orders_sorted: orders_sorting
        }
        return result
    } catch (e) {
        console.error("### ERROR ###", e)
        let message = {
            uuid: "",
            time: new Date(),
            curl: get(e, 'config.curlCommand', 'error not api')
        }

        let curl_mock = message.curl
        let string = ''

        for (let i = 0; i < curl_mock.length; i++) {
            if (curl_mock.charAt(i) === '[') {
                string += '\\' + curl_mock.charAt(i)
                continue
            } else if (curl_mock.charAt(i) === ']') {
                string += '\\' + curl_mock.charAt(i)
                continue
            }
            string += curl_mock.charAt(i)
        }

        message.curl = string
        let data = {
            message: e.message,
            url: url,
        }

        let resLog = await saveLog(f(message), JSON.stringify(data), url)
        const log_id = resLog.data.id
        let result = {
            success: false,
            orderType,
            log_id: log_id,
            message: e.message
        }
        return result
    }

}


const getOrderHistoryWithCache = async ({
    tokenHydra,
    baId,
    requestData,
    byPassCache,
    hitCouter,
    source_url
}) => {
    const dateCreated = getStatisDateCreated()
    const params = {
        expand: `order,rma`,
        customer: `me|sponsoredCustomers?type=Customer`,
        dateCreated,
    }

    let isCacheUsage = false

    const tag = 'etl/OrderHistory'
    const now = new Date().toISOString().replace("T", " ").substring(0, 22)
    const cacheId = generateCacheId({ baId })
    const customerHref = createHashHref(baId, "customer")

    let data
    let usageCounter = 0
    let minDiff

    if (byPassCache) {
        data = await getOrderHistoryFromHydra({ tokenHydra, customerHref, params, source_url })
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
                data = await getOrderHistoryFromHydra({ tokenHydra, customerHref, params, source_url })
            } else {
                console.info(`${tag} cache usage.`)
                data = parseBodyJSON(value)
                usageCounter = hitCouter ? couter + 1 : couter
                isCacheUsage = true
            }
        } else {
            data = await getOrderHistoryFromHydra({ tokenHydra, customerHref, params, source_url })
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

module.exports = {
    getOrderHistoryWithCache,
    getCustomer,
    getBoxProfile,
    getOrderHistoryFromHydra,
    getOrderHistoryByDashboard,
    getAddressBook,
    getCommission,
    getFacebookLogin,
    getSuccessTracker,
    getSeminar,
    getLsb,
    getBoxProfileWithCatch,
    getOrderHistoryWithCatch,
    getAddressBookWithCache,
    getCommissionWithCache,
    getFacebookLoginWithCache,
    getSuccessTrackerWithCache,
}