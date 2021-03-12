'use strict';
const axios = require('axios');
const Joi = require('joi');
const get = require('lodash.get');
const { createResponse } = require('../use/createResponse');
const curlirize = require('axios-curlirize');
const { saveLog } = require('../use/createLog');

curlirize(axios);

const f = obj => [
    `{`,
    Object.keys(obj).reduce((lines, key) => [...lines, `\t\"${key}\": \"${obj[key]}\"`], []).join(`,\n`),
    `}`
].join(`\n`)

module.exports.autoshipList = async event => {
    const header = event.headers.Authorization
    const source_url = get(event, 'headers.referer', 'No Referer')
    const url_hydra = 'https://hydra.unicity.net/v5a/customers/me/autoorders'
    // const url_hydra = 'https://api.mocki.io/v1/3e42e3c9'
    try {
        let res = await axios({
            method: 'get',
            url: url_hydra,
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


        // let resLog = await saveLog(f(message), JSON.stringify(res.data), url)
        let resLog = await saveLog(f(message), JSON.stringify(res.data), source_url)
        const log_id = resLog.data.id

        // const schema = Joi.object({
        //     log_id: Joi.number(),
        //     items: Joi.array().items(Joi.object({
        //         currency: Joi.string().default(""),
        //         dateCreated: Joi.date().default(""),
        //         href: Joi.string().default(""),
        //         id: Joi.object(),
        //         recurrence: Joi.object(),
        //         terms: Joi.object(),
        //     }))
        // })

        let result = {
            log_id: log_id,
            items: []
        }

        res.data.items.forEach(element => {
            result.items.push({
                ...element
                // currency: element.currency,
                // dateCreated: element.dateCreated,
                // href: element.href,
                // id: {
                //     unicity: element.id.unicity
                // },
                // recurrence: {
                //     lastOrderId: {
                //         unicity: get(element, 'recurrence.lastOrderId.unicity', '-')
                //     },
                //     lastRunDate: get(element, 'recurrence.lastRunDate', '-')
                // },
                // terms: {
                //     pv: element.terms.pv,
                //     total: element.terms.total
                // }
            })
        });

        // await schema.validateAsync(result)
        return createResponse(200, { data: result })
    } catch (e) {
        let message = {
            uuid: e.response.headers['x-request-uuid'],
            time: e.response.headers.date,
            curl: e.config.curlCommand,
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
        const data_catch = {
            url: url_hydra
        }

        // let resLog = await saveLog(f(message), JSON.stringify(res.data), url)
        let resLog = await saveLog(f(message), JSON.stringify(data_catch), source_url)

        const data = {
            log_id: resLog.data.id,
            data: e.message
        }

        return createResponse(400, { data: data })
    }
};


module.exports.autoshipDetail = async event => {
    const url = event.queryStringParameters.url
    const header = event.headers.Authorization
    const source_url = get(event, 'headers.referer', 'No Referer')
    try {
        // const schema = Joi.object({
        //     log_id: Joi.number(),
        //     href: Joi.string(),
        //     lines: Joi.object({
        //         items: Joi.array().items(Joi.object({
        //             item: Joi.object(),
        //             catalogSlide: Joi.object(),
        //             terms: Joi.object({
        //                 priceEach: Joi.number(),
        //                 pvEach: Joi.number()
        //             }),
        //             quantity: Joi.number()
        //         })).required(),
        //     }),
        //     recurrence: Joi.object(),
        //     shipToAddress: Joi.object(),
        //     shipToEmail: Joi.string(),
        //     shipToName: Joi.object(),
        //     shipToPhone: Joi.string(),
        //     terms: Joi.object(),
        //     transactions: Joi.object()
        // })

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


        // let resLog = await saveLog(f(message), JSON.stringify(res.data), url)
        let resLog = await saveLog(f(message), JSON.stringify(res.data), source_url)
        const log_id = resLog.data.id

        let items = []
        res.data.lines.items.forEach((element) => {
            items.push({
                ...element,
                // item: {
                //     id: {
                //         unicity: element.item.id.unicity
                //     }
                // },
                // catalogSlide: {
                //     content: {
                //         description: element.catalogSlide.content.description
                //     }
                // },
                // terms: {
                //     priceEach: element.terms.priceEach,
                //     pvEach: element.terms.pvEach,
                // },
                // quantity: element.quantity
            })
        })

        // let result = {
        //     log_id: log_id,
        //     href: res.data.href,
        //     lines: {
        //         items: [...items],
        //     },
        //     recurrence: {
        //         dateNext: res.data.recurrence.dateNext
        //     },
        //     shipToAddress: {
        //         ...res.data.shipToAddress
        //     },
        //     shipToEmail: res.data.shipToEmail,
        //     shipToName: {
        //         fullName: res.data.shipToName.fullName,
        //         'fullName@ja': res.data.shipToName['fullName@ja']
        //     },
        //     shipToPhone: res.data.shipToPhone,
        //     terms: {
        //         freight: { amount: res.data.terms.freight.amount },
        //         pv: res.data.terms.pv,
        //         subtotal: res.data.terms.subtotal,
        //         total: res.data.terms.total
        //     },
        //     transactions: {
        //         items: [
        //             {
        //                 method: res.data.transactions.items[0].method
        //             }
        //         ]
        //     }
        // }

        let result = {
            log_id: log_id,
            ...res.data
        }

        // await schema.validateAsync(result)

        return createResponse(200, { data: result })
    } catch (e) {
        let message = {
            uuid: e.response.headers['x-request-uuid'],
            time: e.response.headers.date,
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

        const data_catch = {
            url: url,
            message: e.message
        }
        // let resLog = await saveLog(f(message), JSON.stringify(res.data), url)
        let resLog = await saveLog(f(message), JSON.stringify(data_catch), source_url)

        const data = {
            log_id: resLog.data.id,
            data: e.message,
        }

        return createResponse(400, { data: data })
    }
};

