const axios = require('axios')
const { API_URLS } = require('./configs')
const { validate } = require('joi')

const loginEmployee = async (user, password) => {
    const url = `${API_URLS.HYDRA}/loginTokens?expand=whoami`
    console.time('loginEmployee')
    const options = {
        method: `post`,
        url,
        data: {
            type: "base64",
            value: Buffer.from(`${user}:${password}`).toString('base64'),
            namespace: `${API_URLS.HYDRA}/employees`
        },
    }
    const { data } = await axios(options)
    console.timeEnd('loginEmployee')
    return data
}

const getStaffUser = async () => loginEmployee("ushopth", "F0rsup3rtok3n")

const getCustomerTokenByBaId = async (hydraToken, baId) => {
    const url = `${API_URLS.HYDRA}/loginTokens`
    console.time(url)
    const options = {
        method: `post`,
        url,
        headers: {
            authorization: `Bearer ${hydraToken}`
        },
        data: {
            type: "unicity",
            value: baId,
            namespace: `${API_URLS.HYDRA}/customers`
        },
    }
    const { data } = await axios(options)
    console.timeEnd(url)
    return data
}

const checkToken = async hydraToken => {
    const url = `${API_URLS.HYDRA}/whoami?expand=whoami`
    console.time(url)
    const options = {
        method: `get`,
        url,
        headers: {
            authorization: new RegExp('^Bearer').test(hydraToken) ? hydraToken : `Bearer ${hydraToken}`
        }
    }
    const { data } = await axios(options)
    console.timeEnd(url)
    return data
}

const getCustomerHref = async baId => {
    const url = `${API_URLS.HYDRA}/customers?id.unicity=${baId}`
    console.time('getCustomerHref')
    const options = {
        method: `get`,
        url,
    }
    const { data } = await axios(options)
    const { items = [] } = data || {}
    const [first] = items
    const { href } = first || {}
    const [customerHref] = href ? href.split("/").slice(-1) : null
    console.timeEnd('getCustomerHref')
    return customerHref
}

const refreshCustomerToken = async hydraToken => {
    console.time("refreshCustomerToken")
    const url = `${API_URLS.HYDRA}/loginTokens`
    const options = {
        method: `post`,
        url,
        data: {
            type: `loginToken`,
            value: /^Bearer /.test(hydraToken) ? hydraToken.replace(/^Bearer /, "") : hydraToken,
            namespace: `${API_URLS.HYDRA}/customers`
        }
    }
    const { data } = await axios(options)
    console.timeEnd("refreshCustomerToken")
    return data
}

const loginTokens = async (reqBody, queryStringParams = {}) => {
    const qsList = Object.keys(queryStringParams).map(key => `${key}=${queryStringParams[key]}`)
    const url = `${API_URLS.HYDRA}/loginTokens${qsList.length > 0 ? `?${qsList.join(`&`)}` : ``}`

    console.timeEnd("loginTokens")
    const options = {
        method: `post`,
        url,
        data: reqBody
    }
    const { data } = await axios(options)
    console.timeEnd("loginTokens")
    return data
}

module.exports = {
    loginEmployee,
    getStaffUser,
    getCustomerTokenByBaId,
    checkToken,
    getCustomerHref,
    refreshCustomerToken,
    loginTokens,
}