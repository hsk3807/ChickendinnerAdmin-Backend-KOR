const _ = require('lodash')
const stringify = require('json-stringify-safe')

module.exports = function(event, context) {
    return {
        getAWSRequestId: getAWSRequestId,
        isProduction: isProduction,
        isDev: isDev,
        isLocal: isLocal,
        getStage: getStage,
        getQueryString: getQueryString,
        getQueryStringValue: getQueryStringValue,
        responseSuccess: responseSuccess,
        responseError: responseError,
        responseErrorMessages: responseErrorMessages,
        objToLookLikeJsonString: objToLookLikeJsonString,
        getLanguage: getLanguage,
        ucfirst: ucfirst
    }
    // ====================================
    function getAWSRequestId() {
        return context.awsRequestId
    }
    function getStage() {
        return process.env.STAGE
    }
    function isProduction() {
        return getStage() === 'prod'
    }
    function isDev() {
        return getStage() === 'dev'
    }
    function isLocal() {
        return getStage() === 'local'
    }
    function getQueryString() {
        return event.queryStringParameters
    }
    function getQueryStringValue(fieldName) {
        if (!_.isObject(event.queryStringParameters)) return null
        if (!event.queryStringParameters.hasOwnProperty(fieldName)) return null
        return event.queryStringParameters[fieldName]
    }
    function responseSuccess(obj) {
        return {
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'x-app-RequestId': getAWSRequestId()
            },
            body: stringify(obj)
        }
    }
    function responseError(obj, code = 400) {
        return {
            statusCode: code,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'x-app-RequestId': getAWSRequestId()
            },
            body: stringify(obj)
        }
    }
    function responseErrorMessages(msgs, code = 400, logId = null) {
        return {
            statusCode: code,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'x-app-RequestId': getAWSRequestId()
            },
            body: stringify({
                error_messages: msgs,
                code: code,
                log_id: logId
            })
        }
    }
    function objToLookLikeJsonString(obj) {
        return [
            `{`,
            Object.keys(obj).reduce((lines, key) => [...lines, `\t\"${key}\": \"${obj[key]}\"`], []).join(`,\n`),
            `}`
        ].join(`\n`)
    }
    function getLanguage () {
        const postData = JSON.parse(event.body)
        if (true
            && postData
            && postData.language
            && 'string' === typeof postData.language
            && postData.language.length === 2
            ) {
            return postData.language.toUpperCase()
        } else {
            return 'EN'
        }
    }
    function ucfirst(string) {
        if ('string' !== typeof string) return string
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}