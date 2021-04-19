'use strict';

const TABLE = 'unishop_payment_log';

module.exports.create = async(db, referenceId, logType, requestData, responseData = '', error = '', requestHeader = '', responseHeader = '') => {
    const sql = `
        INSERT INTO ${TABLE} 
        (reference_id, log_type, request_data, response_data, error, request_header, response_header)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    return await db.exec(sql, [referenceId, logType, requestData, responseData, error, requestHeader, responseHeader]);
};

module.exports.createPaymentReturn = async(db, referenceId, requestData, requestHeader = '') => {
    return await this.create(db, referenceId, 'payment return', requestData, '', '', requestHeader)
};
module.exports.createPaymentTrigger = async(db, referenceId, responseData, responseHeader = '') => {
    return await this.create(db, referenceId, 'payment trigger', '', responseData, '', responseHeader)
};