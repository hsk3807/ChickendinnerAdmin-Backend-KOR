'use strict';

const _ = require('lodash');
const axios = require('axios');
const responseHelper = require('../helpers/responseHelper');
const dbHelper = require('../helpers/dbHelper');
const commonHelper = require('../helpers/commonHelper');
const orderHelper = require('../helpers/orderHelper');
const hydraHelper = require('../helpers/hydraHelper');
const paymentHelper = require('../helpers/paymentHelper');
const cartModel = require('../model/unishop_cart');
const paymentModel = require('../model/unishop_payment');
const smsLogModel = require('../model/unishop_sms_log');
const apiHelper = require('../helpers/apiHelper');

module.exports.main = async (event, context, callback) => {
  console.log('================ create_order ================')
  let db = null;
  try {
    db = dbHelper.getMysqlDBConnection();
    const referenceId = commonHelper.getQueryString(event, 'reference_id');
    if (_.isEmpty(referenceId)) {
      throw new Error('empty reference_id');
    }
    const result = await orderHelper.createQROrderByReferenceId(db, referenceId);
    await paymentModel.updateBankName(db, 'QR', referenceId);
    return responseHelper.createSuccess(result, commonHelper.getAppRequestId(context))
  } catch (e) {
    console.log('e', e.stack)
    return responseHelper.createFail([e.message], 400, commonHelper.getAppRequestId(context));
  } finally {
    if (db !== null) {
      db.disconnect();
    }
  }
};