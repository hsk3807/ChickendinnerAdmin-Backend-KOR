const axios = require('axios')
const aws = require('aws-sdk');
const getCountryISO3 = require("country-iso-2-to-3");
const lambda = new aws.Lambda();
const { API_URLS } = require('./configs')
const { convertToQueryString, parseBodyJSON, generateCacheId } = require('../utils/helpers')
const RequestCacheService = require('./requestCacheService')
const Helpers = require('../utils/helpers')
const EtlHelper = require('../utils/etlHelper')
const {
    CACHE_REQUEST_MIN,
    FUNC_NAME_ETL_GENEALOGY,
} = process.env

const EtlService = require('./etlService');
const curlirize = require('axios-curlirize')
const { saveLog } = require('../utils/saveLog');
const get = require('lodash.get');

curlirize(axios);

const getStatisDateCreated = () => {
    let begin = new Date()
    begin.setMonth(begin.getMonth() - 5)
    let end = new Date()

    begin = begin.toISOString().substring(0, 7)
    end = end.toISOString().substring(0, 7)

    return `[${begin};${end}]`
}

const f = obj => [
    `{`,
    Object.keys(obj).reduce((lines, key) => [...lines, `\t\"${key}\": \"${obj[key]}\"`], []).join(`,\n`),
    `}`
].join(`\n`)

const etLGetGenealogy = async (tokenHydra, customerHref, params, source_url) => {
    // const url = `${API_URLS.HYDRA}/customers/${customerHref}/sponsoredCustomersTreePreOrder${convertToQueryString(params)}`
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/sponsoredCustomersTreePreOrder${convertToQueryString(params)}`
    console.time(url)

    try {
        const options = {
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        }
        const res = await axios(options)

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

        let dataSaveLog = JSON.stringify(res.data)
        dataSaveLog = JSON.parse(dataSaveLog)
        // let conversStatus = 'success'
        let response_saveLog = JSON.stringify(dataSaveLog)
        // try {
        //     response_saveLog = JSON.stringify(dataSaveLog)
        // } catch (err) {
        //     dataSaveLog.items = []
        //     response_saveLog = JSON.stringify(dataSaveLog)
        //     conversStatus = 'fail'
        // }

        let log_id
        try {
            resLog = await saveLog(f(message), response_saveLog, url)
            log_id = resLog.data.id
        } catch (e) {
            log_id = e.message
        }


        let item_filter = []
        item_filter = res.data.items.map(r => EtlHelper.toEtlGenealogyItem(r))

        let result = {
            log_id: log_id,
            // log_convert: conversStatus,
            success: true,
            items: item_filter
        }
        return result
    } catch (e) {
        let message = {
            uuid: "",
            time: Date.now(),
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
            url: url
        }
        let resLog = await saveLog(f(message), JSON.stringify(data), url)
        const log_id = resLog.data.id
        let result = {
            log_id: log_id,
            success: false,
            message: e.message
        }
        return result
    }
}

const getGenealogyWithCombineOthers = async (
    tokenHydra,
    customerHref,
    baId,
    params,
    source_url,
    ushopCountryCode,
    orderType,
) => {
    const reqAchievementsHistory = EtlService.getSuccessTracker({
        tokenHydra,
        customerHref,
        params: { expand: 'metrics' },
        source_url
    })
    const reqOrderHistory = EtlService.getOrderHistoryFromHydra({
        tokenHydra,
        customerHref,
        params: {
            expand: `order,rma`,
            customer: `me|sponsoredCustomers?type=Customer`,
            dateCreated: getStatisDateCreated(),
        },
        source_url,
        orderType,
    })

    const reqGenealogy = etLGetGenealogy(tokenHydra, customerHref, params, source_url)

    const reqSeminar = EtlService.getSeminar({
        baId,
        params: { country_code: ushopCountryCode },
    })

    const res = await Promise.allSettled([
        reqAchievementsHistory,
        reqOrderHistory,
        reqGenealogy,
        reqSeminar,
    ])
    const errorProcesses = res.filter(({ status }) => status === 'rejected').map(({ reason }) => reason)
    if (errorProcesses.length > 0) throw errorProcesses

    const [
        achievementsHistory,
        orderHistory,
        genealogy,
        seminar,
    ] = res.map(({ value }) => value)

    return {
        genealogy,
        achievementsHistory,
        seminar,
        orderHistory,
    }
}

const getWithCatchGenealogy = async (
    tokenHydra,
    baId,
    params,
    byPassCache = false,
    requestData,
    hitCouter,
    source_url,
    ushopCountryCode,
) => {
    let isCacheUsage = false

    const tag = 'etl/Genealogy'
    const now = new Date().toISOString().replace("T", " ").substring(0, 22)
    const cacheId = generateCacheId({ baId })
    const customerHref = Helpers.createHashHref(baId, "customer")

    let data
    let usageCounter = 0
    let minDiff

    if (byPassCache) {
        data = await getGenealogyWithCombineOthers(tokenHydra, customerHref, baId, params, source_url, ushopCountryCode)
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
                data = await getGenealogyWithCombineOthers(tokenHydra, customerHref, baId, params, source_url, ushopCountryCode)
            } else {
                console.info('Genealogy cache usage.')
                data = parseBodyJSON(value)
                usageCounter = hitCouter ? couter + 1 : couter
                isCacheUsage = true
            }
        } else {
            data = await getGenealogyWithCombineOthers(tokenHydra, customerHref, baId, params, source_url, ushopCountryCode)
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

    const { seminar, ...otherData } = data

    data = {
        cache: isCacheUsage,
        age: isCacheUsage
            ? minDiff > 20 ? 3 : minDiff > 10 ? 2 : 1
            : minDiff > 720 ? 0 : 99,
        ...otherData,
        seminar: {
            cache: false,
            ...seminar,
        },
    }
    return data
}

const getGenealogyIgnoreCache = async (
    tokenHydra,
    baId,
    params,
    source_url,
    ushopCountryCode,
    orderType,
) => {
    {

        const customerHref = Helpers.createHashHref(baId, "customer")
        const results = await getGenealogyWithCombineOthers(
            tokenHydra,
            customerHref,
            baId,
            params,
            source_url,
            ushopCountryCode,
            orderType,
        )

        const data = {
            cache: false,
            isIgnoreCache: true,
            age: 99,
            ...results
        }

        return data
    }
}

const invokePrepareCache = async e => {
    return lambda.invoke({
        FunctionName: FUNC_NAME_ETL_GENEALOGY,
        InvocationType: 'Event',
        Payload: JSON.stringify(e, null, 2),
    }).promise()
}

module.exports = {
    etLGetGenealogy,
    getWithCatchGenealogy,
    invokePrepareCache,
    getGenealogyIgnoreCache,
}