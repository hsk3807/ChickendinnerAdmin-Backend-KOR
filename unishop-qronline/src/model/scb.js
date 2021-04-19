'use strict';

const _ = require('lodash');
const dbHelper = require('../helpers/dbHelper');
const TABLE = 'payments-scb-confirms';

module.exports.create = async(stage, db, postData) => {
    if (_.isEmpty(postData)) return;
    const data = _.isString(postData)? JSON.parse(postData): postData;
    const createdData = {
        TableName: dbHelper.getTableName(stage, TABLE),
        Item: data        
    }
    console.log('CREATED DATA', createdData);
    return db.put(createdData).promise();
}