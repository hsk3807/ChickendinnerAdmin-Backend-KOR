const httpStatus = {
    ok: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    Unauthorized: 401,
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


module.exports = {
    httpStatus,
    parseBodyJSON,
    createResponse,
    createServiceError,
    toEmptyData
}