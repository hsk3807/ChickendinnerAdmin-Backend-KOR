const { v5:uuidV5 } = require("uuid")
const crypto = require("crypto")

const httpStatus = {
    ok: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    Conflict: 409,
    Gone: 410,
    InternalServerError: 500
}

const parseBodyJSON = body => (typeof body === "object") ? body : JSON.parse(body || "{}")

const createResponse = (statusCode, { headers, data, message, error }, extendOptions = {}) => {
    const body = (message || error)
        ? JSON.stringify({ ...{ message }, ...{ error } })
        : data

    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": "application/json",
            ...headers
        },
        body,
        ...extendOptions
    }
}

const createServiceError = (httpStatus, message) => ({
    error: {
        httpStatus,
        message
    }
})

const toEmptyData = (sampleObj, setOnKeys = []) => {
    for (key of Object.keys(sampleObj)) {
        if (typeof sampleObj[key] === 'object' && sampleObj[key] !== null) {
            toEmptyData(sampleObj[key], setOnKeys)
        } else {
            if (setOnKeys.includes(key)) sampleObj[key] = null
        }
    }
}

const convertToQueryString = obj => `?` +
    Object.keys(obj)
        .filter(key => !(obj[key] === null || obj[key] === "" || obj[key] === undefined))
        .map(key => `${key}=${obj[key]}`)
        .join('&')

const generateCacheId = getRequestQuery =>{
    return uuidV5(JSON.stringify(getRequestQuery), '1b671a64-40d5-491e-99b0-da01ff1f3341')
}

const createHashHref = (id, hrefType) => {
    const text = hrefType === 'customer'? 'unicity': hrefType === 'order'? 'infotrax': ''
    if (text === '') return ''
    const iv = new Buffer.alloc(16);
    const key = "d8578edf8458ce06fbc5bb76a58c5ca4";
    const cypher = crypto.createCipheriv("aes-256-cbc", key, iv);
    cypher.setAutoPadding(false);
    let input = Buffer.from(`?${text}=${id}`, "ascii");
    let len = Math.ceil(input.length / 16) * 16;
    let max = Buffer.alloc(len, 0);
    let dec = cypher.update(Buffer.concat([input, max], len));
    dec = Buffer.concat([dec, cypher.final()]);
    return dec.toString("hex");    
}

module.exports = {
    httpStatus,
    parseBodyJSON,
    createResponse,
    createServiceError,
    toEmptyData,
    convertToQueryString,
    generateCacheId,
    createHashHref,
}