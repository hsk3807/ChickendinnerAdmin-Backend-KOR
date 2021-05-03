'use strict';

const _ = require('lodash');
const stringify = require('json-stringify-safe');
const responseHelper = require('../helpers/responseHelper');
const dbHelper = require('../helpers/dbHelper');
const commonHelper = require('../helpers/commonHelper');
const orderHelper = require('../helpers/orderHelper');
const paymentModel = require('../model/unishop_payment');
const paymentLogModel = require('../model/unishop_payment_log');

module.exports.main = async (event, context, callback)  => {
  let db = null;
  try {

    const [data] = event.Records;
    if (data.eventName !== 'INSERT') {       
      console.log('trigger event not insert', event)
      return responseHelper.createSuccess({success: true});
    }
    console.log('trigger event insert', event);    

    db = dbHelper.getMysqlDBConnection();
    const eventId = data.eventID;
    let referenceId = data.dynamodb.NewImage.billPaymentRef1.S;
    const qrData = commonHelper.unmarshall(data.dynamodb.NewImage);
    console.log('trigger data', qrData);
    console.log('trigger reference_id', referenceId);
    const paymentRecord = isNaN(referenceId)
      ? await paymentModel.getPaymentRecordByReferenceId(db, referenceId): await paymentModel.getPaymentRecordByReferenceId2(db, referenceId);
    if (_.isEmpty(paymentRecord)) {
      throw new Error(`record_not_found|${referenceId}`);
    }
    referenceId = paymentRecord.reference_id;
    if (!_.isEmpty(paymentRecord.return_payment_data)) {
      throw new Error(`already_triggered|${referenceId}`);
    }
    try {
      await paymentLogModel.createPaymentReturn(db, referenceId, JSON.stringify(qrData), stringify({event, context}));
      await paymentModel.updateReturnQRPaymentData(db, referenceId, JSON.stringify(qrData));
      const result = await orderHelper.createQROrderByReferenceId(db, referenceId);
      paymentLogModel.createPaymentTrigger(db, referenceId, JSON.stringify(result));
      return responseHelper.createSuccess(data.dynamodb);
    } catch (error) {
      console.log('inside error', error.stack)
      throw new Error(`${error.message}|${referenceId}`)
    }
  } catch (e) {
    console.log(e.stack);
    const [msg, referenceId] = e.message.split('|');
    paymentLogModel.createPaymentTrigger(db, referenceId? referenceId: '', e.stack);
    return responseHelper.createFail([msg]);
  } finally {
    if (db !== null) {
        db.disconnect();
    }
  }
};
