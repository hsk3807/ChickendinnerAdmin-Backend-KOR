const httpStatus = {
    ok: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    forbidden: 403,
    notFound: 404,
    Conflict: 409,
    InternalServerError: 500
}

const parseBodyJSON = body => (typeof body === "object") ? body : JSON.parse(body || "{}")

const createResponse = (statusCode, { data, message, error }) => {
    const body = (message || error) ? { message, error } : data
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Credentials": true,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
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