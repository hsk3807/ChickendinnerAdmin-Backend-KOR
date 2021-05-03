const _ = require('lodash')
const stringify = require('json-stringify-safe')
const moment = require('moment-timezone')

module.exports = function(event, context) {
    return {
        getAWSRequestId: getAWSRequestId,
        isProduction: isProduction,
        isDev: isDev,
        isLocal: isLocal,
        getStage: getStage, 
        getQueryString: getQueryString,
        getQueryStringValue: getQueryStringValue,
        getAuthorization: getAuthorization,
        getPathParameter: getPathParameter,
        responseSuccess: responseSuccess,
        responseError: responseError,
        responseErrorMessages: responseErrorMessages,
        isValidToken: isValidToken,
        nowStr: nowStr
    }
    // ==================================== 
    function getAWSRequestId () {
        return context.awsRequestId
    }
    function getStage () {
        return process.env.STAGE
    }
    function isProduction() {
        return getStage () === 'prod'
    }
    function isDev() {
        return getStage () === 'dev'
    }
    function isLocal () {
        return getStage() === 'local'
    }
    function getQueryString () {
        return event.queryStringParameters
    }
    function getQueryStringValue (fieldName) {
        if (!_.isObject(event.queryStringParameters)) return null
        if (!event.queryStringParameters.hasOwnProperty(fieldName)) return null
        return event.queryStringParameters[fieldName]
    }
    function getAuthorization () {
        return event.headers.Authorization
    }
    function getPathParameter (key) {
        return event.pathParameters[key]
    }
    function responseSuccess (obj) {
        return {
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'x-app-request-id': getAWSRequestId()
            },             
            body: stringify(obj)
        }
    }
    function responseError (obj, code = 400) {
        return {
            statusCode: code,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'x-app-request-id': getAWSRequestId()                
            },             
            body: stringify(obj)
        }
    }
    function responseErrorMessages (msgs, code = 400) {
        return responseError({
            error_messages: msgs,
            code: code
        }, code)
    }
    function isValidToken () {
        return (getAuthorization() === `Bearer ${process.env.TOKEN}`)
    }
    function nowStr() {
        return moment.tz("Asia/Bangkok").format('YYYY-MM-DD HH:mm:ss');
    }
}