'use strict';

const _ = require('lodash');
const stringify = require('json-stringify-safe');
const paymentModel = require('../model/unishop_payment');
const paymentLogModel = require('../model/unishop_payment_log');
const cartModel = require('../model/unishop_cart');
const hydraHelper = require('../helpers/hydraHelper');
const paymentHelper = require('../helpers/paymentHelper');
const apitHelper = require('../helpers/apiHelper');

const smsHelper = require('../helpers/smsHelper');

module.exports.ORDER_TYPE = {
  ENROLL: 'enroll',
  SHOPPING_LOGIN: 'shopping login',
  SHOPPING_ANONYMOUS: 'shopping anonymous',
  SHOPPING_RETAIL: 'shopping retail',
  SHOPPING_PROFILE: 'shopping profile'
};

module.exports.createQROrderByReferenceId = async(db, referenceId) => {

    const paymentRecord = await paymentModel.getPaymentRecordByReferenceId(db, referenceId);
    if (_.isEmpty(paymentRecord)) {
      throw new Error('reference_id not found');
    }
    if (!_.isEmpty(paymentRecord.order_id)) {
      throw new Error('Order already created.');
    }
    if (!paymentHelper.skipCheckMatchTotalAndAmount(paymentRecord)) {
      const [isMatch, total, amount] = paymentHelper.checkMatchTotalAndAmount(paymentRecord);
      if (!isMatch) {
        throw new Error(`Total(${total}) is not match with Amount(${amount}).`);
      }
    }
    let resultHydra = null;
    let paymentStatus = '';
    const cartItems = await cartModel.getCartWithItemsByReferenceId(db, referenceId);
    const cart = cartItems[0];
    const logType = paymentHelper.getLogType(paymentRecord.type);
    console.log(`\ncreateQROrderByReferenceId > ${referenceId}: ${paymentRecord.type}`)
    switch (paymentRecord.type) {
      case this.ORDER_TYPE.ENROLL:
        resultHydra = await paymentHelper.createOrderWithEnroll(paymentRecord);
      break;
      case this.ORDER_TYPE.SHOPPING_LOGIN:
        resultHydra = await paymentHelper.createOrderWithLogin(paymentRecord);
        if (true
            && resultHydra.status === 'error'
            && resultHydra.resultError
            && resultHydra.resultError.error.code === 401
            && resultHydra.resultError.error.message === 'Unauthorized') {
            
          await paymentLogModel.create(
            db,
            referenceId,
            logType,
            JSON.stringify(resultHydra.postDataToHydra),
            JSON.stringify(resultHydra.resultError), '', '', JSON.stringify(resultHydra.responseHeaderFromHydra))

          // generate new token
          const newToken = await paymentHelper.getBaTokenByPaymentRecord(paymentRecord);
          if (!_.isEmpty(newToken)) {
            paymentModel.updateToken(db, referenceId, newToken);
            paymentRecord.token = newToken;
            resultHydra = await paymentHelper.createOrderWithLogin(paymentRecord);
          }
        }
      break;
      case this.ORDER_TYPE.SHOPPING_ANONYMOUS:
        paymentRecord.token = await paymentHelper.getEmployeeToken();
        resultHydra = await paymentHelper.createOrderWithPOS(paymentRecord);
      break;
      case this.ORDER_TYPE.SHOPPING_RETAIL:
      case this.ORDER_TYPE.SHOPPING_PROFILE:
        resultHydra = await paymentHelper.createOrderWithoutLogin(paymentRecord);
      break;      
      default:
        throw new Error('Invalid order type.');
    }
    paymentStatus = resultHydra.status === 'success'? paymentHelper.status.success: paymentHelper.status.fail; 
    console.log('\nresultHydra\n', stringify(resultHydra));
    return await this.handleHydraResult(db, referenceId, resultHydra, logType, paymentStatus, cart, paymentRecord)
};

module.exports.handleHydraResult = async(db, referenceId, resultHydra, logType, paymentStatus, cart, paymentRecord) => {
  try {
    if (resultHydra.status === 'success') {
      const orderId = resultHydra.resultSuccess.id.unicity;
      const newId = [paymentHelper.getLogType('enroll'), paymentHelper.getLogType('shopping retail')].includes(logType)
          ? resultHydra.resultSuccess.customer.id.unicity: '';

      await paymentModel.updateOrderId(db, orderId, newId, paymentStatus, referenceId);
      await paymentLogModel.create(
        db,
        referenceId,
        logType,
        JSON.stringify(resultHydra.postDataToHydra),
        JSON.stringify(resultHydra.resultSuccess),
        '',
        JSON.stringify(resultHydra.requestHeader),
        JSON.stringify(resultHydra.responseHeaderFromHydra));
      await apitHelper.resendConfirmationEmail('TH', referenceId);
      await smsHelper.sendConfirmationMessage(db, referenceId, orderId, newId, cart, 'TH', paymentRecord, smsHelper.SMS_TYPE.CONFIRM_ORDER);
      if (paymentRecord.type === this.ORDER_TYPE.SHOPPING_ANONYMOUS) {
        const customerInfo = await hydraHelper.getCustomerInfoByBaId(paymentRecord.referral_id, hydraHelper.CONFIG.ADMIN_TOKEN1)
        let customerMobile = customerInfo.mobilePhone.length === 10? customerInfo.mobilePhone: ''
        customerMobile = customerMobile.length !== 10 && customerInfo.homePhone.length === 10? customerInfo.homePhone: ''
        if (customerMobile.length === 10 && customerMobile !== cart.mobile) {
          cart.mobile = customerMobile
          await smsHelper.sendConfirmationMessage(db, referenceId, orderId, newId, cart, 'TH', paymentRecord, smsHelper.SMS_TYPE.CONFIRM_ORDER);
        }       
      }
      await paymentHelper.saveShareCartStat(paymentRecord)
      const response = {
        success: 'yes',
        reference_id: referenceId,
        order_id: orderId,
        new_id: newId        
      };
      return response;
    } else {
      await paymentLogModel.create(
        db,
        referenceId,
        logType,
        JSON.stringify(resultHydra.postDataToHydra),
        JSON.stringify(resultHydra.resultError),
        '',
        JSON.stringify(resultHydra.requestHeader),
        JSON.stringify(resultHydra.responseHeaderFromHydra));
      const errorResponse = {
        error_messages: [resultHydra.resultError.error.error_message],
        error_code: resultHydra.resultError.error.error_code,
        message: resultHydra.resultError.error.message,
        code: resultHydra.resultError.error.code
      };
      return errorResponse;   
    }
  } catch (error) {
    console.log('handleHydraResult', error.stack)
    throw error;
  }
};