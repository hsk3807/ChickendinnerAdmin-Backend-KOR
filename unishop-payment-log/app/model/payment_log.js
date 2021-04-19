const _ = require('lodash');
const UUID = require('uuidjs');

const config = require('../config');
const db = require('../helper/db');
const Utils = require('../helper/utils')
const TABLE = 'unishop_payment_log';

module.exports.create = (stage, postData) => {
    const db_table = config.PREFIX_TABLE[stage] + TABLE;
    const created_date = Utils.nowStr();
    return db.put({
        TableName: db_table,
        Item: {
            reference_id: _.isEmpty(postData.reference_id)? UUID.generate(): postData.reference_id,
            log_type: postData.log_type,
            request_header: [{
                data: postData.request_header === ''? null: postData.request_header,
                created_date: created_date
            }],
            request_data: [{
                data: postData.request_data,
                created_date: created_date
            }],
            response_header: [{
                data: postData.response_header === ''? null: postData.response_header,
                created_date: created_date
            }],            
            response_data: [{
                data: postData.response_data === ''? null: postData.response_data,
                created_date: created_date
            }],
            stamp_created: created_date
            
        },
        ConditionExpression: 'attribute_not_exists(log_type)'

    }).promise();

};
module.exports.checkCreatedValidation = (postData) => {
    // if (!postData.reference_id) {
    //     return 'invalid_reference_id';
    // }
    if (!postData.log_type) {
        return 'invalid_log_type';
    }
    // if (!postData.request_header && postData.request_header !== null ) {
    //     return 'invalid_request_header';
    // }
    if (!postData.request_data) {
        return 'invalid_request_data';
    }
    // if (!postData.response_data && postData.request_header !== null ) {
    //     return 'invalid_response_data';
    // }
    return null;
}
module.exports.get = (stage, postData) => {
    const db_table = config.PREFIX_TABLE[stage] + TABLE;
    return db.get({
        TableName: db_table,
        Key: {
            reference_id: _.isEmpty(postData.reference_id)? UUID.generate(): postData.reference_id,
            log_type: postData.log_type
        }
    }).promise();
};

module.exports.update = (stage, postData) => {
    const db_table = config.PREFIX_TABLE[stage] + TABLE;
    const created_date = Utils.nowStr();
    return db.update({
        TableName: db_table,
        Key: {
            reference_id: postData.reference_id,
            log_type: postData.log_type
        },
        UpdateExpression: 'set #request_header = list_append(#request_header, :request_header), #request_data = list_append(#request_data, :request_data), #response_header = list_append(#response_header, :response_header), #response_data = list_append(#response_data, :response_data)',
        ExpressionAttributeNames: {
            '#request_header': 'request_header',
            '#request_data': 'request_data',
            '#response_header': 'response_header',
            '#response_data': 'response_data'
        },
        ExpressionAttributeValues: {
            ':request_header': [{
                data: postData.request_header === ''? null: postData.request_header,
                created_date: created_date
            }],
            ':request_data': [{
                data: postData.request_data,
                created_date: created_date
            }],
            ':response_header': [{
                data: postData.response_header === ''? null: postData.response_headr,
                created_date: created_date
            }],            
            ':response_data': [{
                data: postData.response_data === ''? null: postData.response_data,
                created_date: created_date
            }],
        }
    }).promise();
}