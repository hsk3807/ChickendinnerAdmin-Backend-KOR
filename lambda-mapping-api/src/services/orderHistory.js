'use strict';
const axios = require('axios');
const Joi = require('joi');
const get = require('lodash.get');
const { createResponse } = require('../use/createResponse');
const curlirize = require('axios-curlirize');
const { saveLog } = require('../use/createLog');
const { last } = require('lodash');
const { traincingOrder } = require('../function/tracking')
const helper = require('../use/helper')
curlirize(axios);

const f = obj => [
    `{`,
    Object.keys(obj).reduce((lines, key) => [...lines, `\t\"${key}\": \"${obj[key]}\"`], []).join(`,\n`),
    `}`
].join(`\n`)


module.exports.orderHistoryDetail = async event => {
    const url = event.queryStringParameters.url
    const header = event.headers.Authorization
    const source_url = get(event, 'headers.referer', 'No Referer')
    try {
        let res = await axios({
            method: 'get',
            url: url,
            headers: { 'Content-Type': 'application/json', 'Authorization': header },
        })

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

        let resLog = await saveLog(f(message), JSON.stringify(res.data), source_url)
        const log_id = resLog.data.id


        // let items_fillter = res.data.lines.items
        //     .reduce(helper.toDistinctOrder, [])
        //     .map(helper.toOrderDetail);

        // let items_fillter = []
        // res.data.lines.items.forEach((element) => {
        //     items_fillter.push({
        //         catalogSlide: {
        //             content: {
        //                 description: element.catalogSlide.content.description
        //             }
        //         },
        //         item: {
        //             id: {
        //                 unicity: element.item.id.unicity
        //             }
        //         },
        //         quantity: element.quantity,
        //         terms: {
        //             priceEach: element.terms.priceEach,
        //             pvEach: element.terms.pvEach,
        //             tax: element.terms.tax,
        //             taxablePriceEach: element.terms.taxablePriceEach
        //         }
        //     })
        // })

        let typeFullname = last(Object.keys(res.data.shipToName))

        const track_id = last(res.data.id.unicity.split('-'))
        let track_result = {}
        let ushopType = ''
        if (res.data.currency === 'THB') {
            track_result = await traincingOrder(track_id)
        }

        if (get(res, 'data.shippingMethod.type', false)) {
            if (res.data.shippingMethod.type === 'DSC') {
                ushopType = 'dsc'
            } else if (res.data.shippingMethod.type.search("Pick Up") >= 0 || res.data.shippingMethod.type.search("Pickup") >= 0) {
                ushopType = 'pickup'
            } else {
                ushopType = ''
            }
        }

        let result = {
            log_id: log_id,
            ...res.data,
            // track_id: track_id,
            // currency: res.data.currency,
            ushopTrackResult: track_result,
            // dateCreated: res.data.dateCreated,
            // lines: {
            //     items: items_fillter
            // },
            // href: res.data.href,
            // id: {
            //     unicity: res.data.id.unicity
            // },
            // market: res.data.market,
            // shipToAddress: {
            //     country: res.data.shipToAddress.country
            // },
            // shipToName: {
            //     fullName: res.data.shipToName.fullName,
            //     'fullName@th': res.data.shipToName['fullName@th']
            // },
            // terms: {
            //     ...res.data.terms
            // },
            // source: res.data.source,
            shippingMethod: {
                ...res.data.shippingMethod,
                ushopType: ushopType
            }
        }

        result.shippingMethod.ushopType = ushopType
        // result.shipToName[typeFullname] = res.data.shipToName[typeFullname]

        // delete result.terms.discount
        // delete result.terms.taxableTotal
        // delete result.shippingMethod.type
        // if (result.shippingMethod.href) {
        //     delete result.shippingMethod.href
        // }

        return createResponse(200, { data: result })
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
        return createResponse(400, { data: result })
    }
};

