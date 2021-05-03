'use strict';

const moment = require('moment-timezone');
const config = require('../config')

module.exports.createResponseError = (msg) => {
	const response = {
        statusCode: 400,
        headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },     
        body: JSON.stringify({
            success: false,
            message: msg,
        })
    };
    return response;
};


module.exports.createResponse = (data) => {
	const response = {
            statusCode: 200,
            headers: {
                'content-type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },          
            body: JSON.stringify({
                success: true,
                data: data

            })
    };
    return response;
};
module.exports.getDeployStage = (event) => {
    if (!event.requestContext) {
        return config.DEPLOY_DEV;
    }
    if (event.requestContext.stage === 'Prod') {
        return config.DEPLOY_PROD;
    } else {
        return config.DEPLOY_DEV;
    }
}
module.exports.nowStr = () => {
    return moment.tz("Asia/Bangkok").format('YYYY-MM-DD HH:mm:ss');
}

