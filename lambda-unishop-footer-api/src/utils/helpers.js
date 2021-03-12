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

const createResponse = (statusCode, { data, message, error }) => {
    const body = (message || error) ? {message, error} : data
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


// Because DynamoDB can't store empty string but need validate string datatype
const provideEmptyStringStore = obj => {
    for (key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
            provideEmptyStringStore(obj[key])
        } else {
            if (obj[key] === '') {
                obj[key] = ' '
            }
        }
    }
}

// Because DynamoDB can't store empty string but need validate string datatype
const provideEmptyStringDisplay = obj => {
    for (key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
            provideEmptyStringDisplay(obj[key])
        } else {
            if (obj[key] === ' ') {
                obj[key] = ''
            }
        }
    }
}


module.exports = { 
    httpStatus, 
    createResponse,
    provideEmptyStringStore,
    provideEmptyStringDisplay
}