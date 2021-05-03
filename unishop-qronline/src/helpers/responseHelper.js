'use strict';

const _ = require('lodash');
const stringify = require('json-stringify-safe');

module.exports.createSuccess = (obj, requestId = null) => {
    const body = _.isString(obj)? obj: stringify(obj);
    const response = {
        statusCode: 200,
        headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },        
        body: body               
    }
    if (!_.isEmpty(requestId)) {
        response.headers['x-app-RequestId'] = requestId;
    }
    return response;
};
module.exports.createFail = (msgs, code = 400, requestId = null) => {

    const obj = {
        error_messages: msgs,
        code: code
    };
    const response =  {
        statusCode: code,
        headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },        
        body: stringify(obj)
    };
    if (!_.isEmpty(requestId)) {
        response.headers['x-app-RequestId'] = requestId;
    }    
    return response;
};