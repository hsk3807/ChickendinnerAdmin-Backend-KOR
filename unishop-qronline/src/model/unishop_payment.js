'use strict';

const _ = require('lodash');

const TABLE = 'unishop_payment';

module.exports.getPaymentRecordByReferenceId = async(db, referenceId) => {
    const sql = "SELECT * FROM unishop_payment WHERE reference_id = ?";
    const results = await db.exec(sql, [referenceId]);
    return results[0] || null;
};

module.exports.getPaymentRecordByReferenceId2 = async(db, referenceId) => {
    const sql = "SELECT * FROM unishop_payment WHERE reference_id_2 = ?";
    const results = await db.exec(sql, [referenceId]);
    return results[0] || null;
};

module.exports.existsReturnPaymentData = async(db, referenceId) => {
    const sql = "SELECT * FROM unishop_payment WHERE reference_id = ? AND return_payment_data is not null AND return_payment_data <> ''";
    const results = await db.exec(sql, [referenceId]);
    console.log('existsReturnPaymentData', results)
    return !_.isEmpty(results);
};

module.exports.updateReturnPaymentData = async(db, referenceId, payment_status, paymentPostData, bankName = null) => {
    let sql = `
        UPDATE ${TABLE}
        SET return_payment_data = ?,
        payment_status = ? 
        `;
    let params = [paymentPostData, payment_status]
    if (!_.isEmpty(bankName)) {
        sql += ', bank_name = ? '
        params.push(bankName)
    }
    sql += ' WHERE reference_id = ?';    
    params.push(referenceId)
    return await db.exec(sql, params);
};
module.exports.updateReturnQRPaymentData = async(db, referenceId, paymentPostData) => {
    return await this.updateReturnPaymentData(db, referenceId, 'payment_success', paymentPostData, 'QR');   
};
module.exports.updateToken = async(db, referenceId, token) => {
    const sql = `
        UPDATE ${TABLE}
        SET token = ? 
        WHERE reference_id = ?
        `;
    return await db.exec(sql, [token, referenceId]);   
}
module.exports.updateOrderId = async(db, orderId, newId, paymentStatus, referenceId) => {
    const sql = `
        UPDATE ${TABLE}
        SET order_id = ?,
        new_id = ?,
        payment_status = ? 
        WHERE reference_id = ?
        `;
    return await db.exec(sql, [orderId, newId, paymentStatus, referenceId]);      

}
module.exports.updateBankName = async(db, bankName, referenceId) => {
    const sql = `
        UPDATE ${TABLE}
        SET bank_name = ? 
        WHERE reference_id = ?
        `;
    return await db.exec(sql, [bankName, referenceId]);
}