const axios = require('axios')
const { API_URLS } = require('./configs')
const { convertToQueryString, parseBodyJSON, createHashHref } = require('../utils/helpers')
const RequestCacheService = require('./requestCacheService')
const deepEqual = require('fast-deep-equal')

const { CACHE_REQUEST_MIN: cacheRequestMin } = process.env

const formUrlEncoded = x =>
    Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')


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
    return data
}

const getOrderHistory = async ({ customerHref, tokenHydra, params }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/ordersAndRmas${convertToQueryString(params)}`
    console.time(url)
    let { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
    console.timeEnd(url)

    // Distinct Items
    if (data && data.orders && Array.isArray(data.orders.items)) {
        data.orders.items = data.orders.items.reduce((list, r) => {
            const { currency, ...compare } = r
            const foundItem = list.find(({ currency, ...it }) => deepEqual(it, compare))
            return foundItem ? list : [...list, r]
        }, [])
    }
    return data
}

const getKrOrderHistory = async ({ customerHref, tokenHydra, params }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/orders${convertToQueryString(params)}`
    console.time(url)
    let { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
    console.timeEnd(url)

    // Distinct Items
    if (data && data.orders && Array.isArray(data.orders.items)) {
        data.orders.items = data.orders.items.reduce((list, r) => {
            const { currency, ...compare } = r
            const foundItem = list.find(({ currency, ...it }) => deepEqual(it, compare))
            return foundItem ? list : [...list, r]
        }, [])
    }
    return data
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

const getSuccessTracker = async ({ customerHref, tokenHydra, params }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/achievementsHistory${convertToQueryString(params)}`
    console.time(url)

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

    let { data } = res || {}
    let { items = [] } = data || {}
    data.items = [...items, ...moreItems]
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
    return data
}

const getSeminar = async ({ baId, params }) => {
    const url = `https://member-calls2.unicity.com/unishop-fn-misc/seminar/v2/get/${baId}${convertToQueryString(params)}`

    console.time(url)
    const { data } = await axios({
        method: `get`,
        url,
    })
    console.timeEnd(url)
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

module.exports = {
    getCustomer,
    getBoxProfile,
    getOrderHistory,
    getKrOrderHistory,
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