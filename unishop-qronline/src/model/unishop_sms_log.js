'use strict';

const _ = require('lodash');
const stringify = require('json-stringify-safe');
const TABLE = 'unishop_sms_log';


module.exports.isDuplicatedMessage = async(db, subject, mobile) => {
    try {
        const sql = "SELECT id FROM unishop_sms_log WHERE sms_subject = ? AND sms_mobile = ?";
        const result = await db.exec(sql, [subject, mobile]);
        return !_.isEmpty(result);     
    } catch (error) {
        console.log('isDuplicatedMessage', error.stack);
        return false;
    }
};

module.exports.create = async(db, referenceId, smsType, subject, mobile, message, sendResult) => {
    try {
        const sql = `
            INSERT INTO ${TABLE} 
            (reference_id, sms_type, sms_subject, sms_mobile, sms_message, sms_result) VALUES
            (?, ?, ?, ?, ?, ?)
        `;
        await db.exec(sql, [referenceId, smsType, subject, mobile, message, stringify(sendResult)]);
    } catch (error) {
        console.log('create', error.stack);
    }
};