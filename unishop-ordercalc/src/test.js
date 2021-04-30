'use strict';

const _ = require('lodash')

module.exports.main = async (event, context, callback) => {
    const Common = require('./local-lib/common')(event, context)

    let response = { success: true }
    if (Common.getQueryStringValue('expand') === 'true') {
        response.event = event
        response.context = context
    }
    return {
        statusCode: 200,
        headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'x-app-RequestId': Common.getAWSRequestId()
        },
        body: JSON.stringify( response )
    };
};