"use strict";

const _ = require("lodash");
const QRCode = require('qrcode');
const responseHelper = require("../helpers/responseHelper");
const dbHelper = require("../helpers/dbHelper");
const commonHelper = require("../helpers/commonHelper");
const paymentHelper = require("../helpers/paymentHelper");
const qrHelper = require("../helpers/qrHelper");
const paymentModel = require('../model/unishop_payment');

module.exports.main = async (event, context) => {
  console.log("================ get_qrcode ================");
  let db = null;
  try {
    db = dbHelper.getMysqlDBConnection();
    const referenceId = commonHelper.getQueryString(event, "reference_id");
    if (_.isEmpty(referenceId)) {
      throw new Error("empty reference_id");
    }
    const paymentRecord = await paymentModel.getPaymentRecordByReferenceId(db, referenceId);
    if (_.isEmpty(paymentRecord)) {
      throw new Error('reference_id not found');
    }
    const referenceId2 = paymentRecord.reference_id_2;
    if (_.isEmpty(referenceId2)) {
      throw new Error('reference_id_2 not found');
    }    
    let [total, success] = paymentHelper.getTotalFromOrderTerm(paymentRecord);
    console.log('result of getTotalFromOrderTerm', total, success)
    if (!success) throw new Error('cannot_get_total')
    const qrCodeData = qrHelper.getData(referenceId2, total);
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeData);
    const response = {
      success: true,
      image_src: qrCodeDataURL      
    };
    if (commonHelper.getQueryString(event, 'show_data') === 'true') {
      response.data = qrCodeData;
    }
    return responseHelper.createSuccess(response, commonHelper.getAppRequestId(context))
  } catch (e) {
    console.log("e", e.stack);
    return responseHelper.createFail(
      [e.message],
      400,
      commonHelper.getAppRequestId(context)
    );
  } finally {
    if (db !== null) {
      db.disconnect();
    }
  }
};
