const _ = require('lodash');
const AWS = require('aws-sdk');

const DB = new AWS.DynamoDB.DocumentClient({region: 'ap-southeast-1'});

module.exports = function(event, context, table) {
    const TABLE = table
    const commonHelper = require('../helper/common')(event, context)
    return {
        create: create,
        get: get,
        batchCreate: batchCreate
    }
    // ====================================
    function create (postData) {
        postData.created_date = commonHelper.nowStr()
        postData.timestamp = Date.now()
        return DB.put({
            TableName: TABLE,
            Item: postData
        }).promise()
    }
    function get (fieldName, value) {
        return DB.get({
            TableName: TABLE,
            Key: { [fieldName]: value }
        }).promise()
    }    
    function batchCreate (items) {
        const created_date = commonHelper.nowStr()
        const timestamp = Date.now()    
        if (!_.isArray(items) || items.length < 1) return false
        const params = {
            RequestItems: {
                [TABLE]: items.map( each => { 
                    each.created_date = created_date
                    each.timestamp = timestamp
                    return {
                        PutRequest: {
                            Item: each
                        }
                    }
                })
            }
        }
        return DB.batchWrite(params, function(err, data) {
            if (err) {
                console.log("Error", err);
            }
        }).promise();
    }
}
