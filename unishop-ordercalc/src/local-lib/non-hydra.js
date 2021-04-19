const stringify = require('json-stringify-safe')
const axios = require('axios')
const NodeCache = require( "node-cache" );
const { ENABLE_CURLIRIZE_LOG } = require('../config/app');
const myCache = new NodeCache();
const DEFAULT_JSON_HEADERS = { 'Content-Type': 'application/json;charset=UTF-8' }

module.exports = function (event, context) {
    const Common = require('./common')(event, context)
    return {
        remoteLog: remoteLog,
        getDictionary: getDictionary,
        getProducts: getProducts
    }
    // ====================================
    async function remoteLog(message, response, url) {
        const api = Common.isLocal()
            ? 'https://member-calls2-dev-kr.unicity.com/unishop-fn-misc/log': 'https://member-calls2-kr.unicity.com/unishop-fn-misc/log'

        try {
            const postData = { message, response, url }
            const result = await axios({
                method: 'POST',
                url: api,
                headers: DEFAULT_JSON_HEADERS,
                data: postData,
                curlirize: ENABLE_CURLIRIZE_LOG
            });
            return result.data
        } catch (error) {
            return error.response.data
        }
    }
    async function getDictionary (languages) {
        const CACHE_KEY = `Dictionary`
        const resultCache = myCache.get(CACHE_KEY)
        if (resultCache) return resultCache

        if (!languages.includes('EN')) languages.push('EN')
        const API = 'https://member-calls2-kr.unicity.com/dictionary/publish?lang='+languages.join(',')
        try {
            const result = await axios({
                method: 'GET',
                url: API,
                headers: DEFAULT_JSON_HEADERS,
                curlirize: ENABLE_CURLIRIZE_LOG
            })
            myCache.set(CACHE_KEY, result.data)
            return result.data
        } catch (error) {
            return []
        }
    }
    async function getProducts (countryCode3, baCustomerType2, itemCodes = [], warehouseName = null) {
        let api = `https://member-calls2-kr.unicity.com/products-v2/publish/${countryCode3}?status=${baCustomerType2}&onlyHasPrice=0&onlyEnable=0`
        if (Array.isArray(itemCodes) && itemCodes.length > 0) {
            api += `&${itemCodes.map(each => `item_code=${each}`).join('&')}`
        }
        if ('string' === typeof warehouseName) {
            api += `&warehouse=${Common.ucfirst(warehouseName)}`
        }
        try {
            const result = await axios({
                method: 'GET',
                url: api,
                headers: DEFAULT_JSON_HEADERS,
                curlirize: ENABLE_CURLIRIZE_LOG
            })
            const products = result.data.items.concat(result.data.renewal, result.data.starter_kit)
            return products
        } catch (error) {
            return []
        }
    }
}