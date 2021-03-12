const axios = require('axios')
const { API_URLS } = require('./configs')
const { convertToQueryString, parseBodyJSON, createHashHref } = require('../utils/helpers')
const curlirize = require('axios-curlirize')
const { saveLog } = require('../utils/saveLog')
const { Mobile } = require('aws-sdk')
const get = require('lodash.get')

curlirize(axios);

const formUrlEncoded = x =>
    Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

const f = obj => [
    `{`,
    Object.keys(obj).reduce((lines, key) => [...lines, `\t\"${key}\": \"${obj[key]}\"`], []).join(`,\n`),
    `}`
].join(`\n`)

const getBoxProfile = async ({ tokenHydra, customerHref, params, source_url }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/${convertToQueryString(params)}`
    console.time(url)
    try {
        const res = await axios({
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
        let etlPhone = ''
        // let newEnroller = null
        // let newSponsor = null
        if (res.data.mobilePhone) {
            etlPhone = res.data.mobilePhone
        } else if (res.data.workPhone) {
            etlPhone = res.data.workPhone
        } else {
            etlPhone = res.data.homePhone
        }
        // const checkEnro = get(res.data, 'enroller.id.unicity', undefined)
        // const checkSponsor = get(res.data, 'sponsor.id.unicity', undefined)
        // if (checkSponsor) {
        //     newSponsor = {
        //         id: {
        //             unicity: get(res.data, 'sponsor.id.unicity', undefined)
        //         }
        //     }
        // }
        // if (checkEnro) {
        //     newEnroller = {
        //         id: {
        //             unicity: get(res.data, 'enroller.id.unicity', undefined)
        //         }
        //     }
        // }
        let data_profile = {
            log_id: log_id,
            success: true,
            href: res.data.href,
            ...res.data,
            etlPhone: etlPhone
            // achievementsHistory: {
            //     href: res.data.achievementsHistory.href
            // },
            // joinDate: res.data.joinDate,
            // id: {
            //     unicity: res.data.id.unicity
            // },
            // metricsProfileHistory: {
            //     ...res.data.metricsProfileHistory
            // },
            // humanName: {
            //     ...res.data.humanName
            // },
            // profilePicture: {
            //     ...res.data.profilePicture
            // },
            // type: res.data.type,
            // status: res.data.status,
            // checkPhone: {
            //     mobilePhone: res.data.mobilePhone,
            //     workPhone: res.data.workPhone,
            //     homePhone: res.data.homePhone,
            // },
            // workPhone: res.data.workPhone,
            // homePhone: res.data.homePhone,
            // email: res.data.email,
            // enroller: newEnroller,
            // sponsor: newSponsor,
            // subscriptions: res.data.subscriptions,
            // mainAddress: res.data.mainAddress,
        }

        delete data_profile.humanName.firstName
        delete data_profile.humanName.lastName
        return data_profile
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



const getCommission = async ({ tokenHydra, customerHref, source_url }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/commissionstatements`
    try {
        console.time(url)
        const res = await axios({
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
        let data_filter
        // console.log('res.data.items', res.data.items)
        // var obj = { "1": 5, "2": 7, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0, "11": 0, "12": 0 }
        if (typeof res.data.items === 'object') {
            data_filter = Object.keys(res.data.items).map(function (key) {
                return res.data.items[key]
            });
        } else {
            res.data.items.forEach((element) => {
                // delete element.market
                data_filter.push({
                    ...element
                })
            })
        }
        let result = {
            success: true,
            log_ig: log_id,
            // ...res.data,
            items: data_filter
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

const getLsb = async ({ baId }) => {
    const url = `https://member-calls.unicity.com/api/unishop/v1/common/global/LBS`
    try {
        console.time(url)
        let res = await axios({
            method: `post`,
            url,
            data: formUrlEncoded({ dist_id: baId }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        console.timeEnd(url)

        // res.data.items = res.data.items.map((element) => ({ entry: element.entry, period: element.period }))

        let data_filter = {
            success: true,
            items: [...res.data.items]
        }
        return data_filter
    } catch (e) {
        let result = {
            success: false,
            message: e.message
        }
        return result
    }
}

module.exports = {
    getBoxProfile,
    getCommission,
    getLsb,
}