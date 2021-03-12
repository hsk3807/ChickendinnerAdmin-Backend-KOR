const { httpStatus } = require("lib-global-configs")
const { serializeError } = require("serialize-error")

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

const createErrorResponse = err =>  createResponse(
    err.httpStatus ? err.httpStatus : httpStatus.internalServerError,
    { 
        message: err.message,
        error: err.error 
            ? err.error instanceof Error ? serializeError(err.error) : err.error 
            : err instanceof Error ? serializeError(err) : err 
    }
)


const validateInput = (object, schema) => {
    let error, value

    const result = schema.validate(object)
    const { error: errorValidate, value: validatedObject } = result || {}

    if (errorValidate) {
        const message = errorValidate.details.map(r => `[${r.path.toString()}] ${r.message}`).join(", ")
        error = {
            message,
            errorValidate,
        }
    } else {
        value = validatedObject
    }

    return { error, value }
}

const convertToQueryString = obj => `?` +
    Object.keys(obj)
        .filter(key => !(obj[key] === null || obj[key] === "" || obj[key] === undefined))
        .map(key => `${key}=${obj[key]}`)
        .join('&')

const formatError = (message, err) => {
    let error = null

    if (err.isAxiosError){
        const axiosError = err.toJSON()
        error = {
            message: axiosError.message,
            timeout: axiosError.config.timeout,
            url: axiosError.config.url,
            method: axiosError.config.method,
            headers: axiosError.config.headers,
            data: axiosError.config.data,
            curlCommand: axiosError.config.curlCommand,
        }
    }else{
        error = serializeError(err)
    }

    return { message, error }
}

const formatErrorService = (name, err) => formatError(`ERROR_SERVICE: ${name}`, err)
const formatErrorHelper= (name, err) => formatError(`ERROR_HELPER: ${name}`, err)
const formatErrorController= (name, err) => formatError(`ERROR_CONTROLLER: ${name}`, err)

module.exports = {
    parseBodyJSON,
    createResponse,
    createErrorResponse,
    validateInput,
    convertToQueryString,
    formatError,
    formatErrorService,
    formatErrorHelper,
    formatErrorController,
}