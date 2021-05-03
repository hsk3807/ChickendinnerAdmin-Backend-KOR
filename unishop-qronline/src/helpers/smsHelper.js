'use strict';

const _ = require('lodash');
const commonHelper = require('../helpers/commonHelper');
const paymentHelper = require('../helpers/paymentHelper');
const apiHelper = require('../helpers/apiHelper');
const smsLogModel = require('../model/unishop_sms_log');

module.exports.SMS_TYPE = {
    CONFIRM_ORDER: 'ConfirmOrder',
    CHANGE_TYPE_OR_STATUS: 'ChangeTypeOrStatus'
};
module.exports.createConfirmationSubject = (orderId) => {
    const id = paymentHelper.removeCountryCodeFromOrderId(orderId);
    return `Confirm Order#${id}`;
}

module.exports.createConfirmationMessage = (orderId, newId, cart, countryCode) => {
    
    const subject = this.createConfirmationSubject(orderId);
    const pv = cart.total_pv === '-1'? '': `-PV${cart.total_pv}`;
    const ba = _.isEmpty(newId)? '': `-BA${newId}`;
    let checkStatusMsg = '';
    let total = '';
    switch (true) {
        case /TH/.test(countryCode):
            checkStatusMsg = 'Check status 02-092-6812';
            total = `-THB${parseFloat(cart.total).toFixed(2)}`;
            break;
        case /SG/.test(countryCode):
            checkStatusMsg = 'Check status:Contact.sg@unicity.com';
            total = `-SGD${parseFloat(cart.total).toFixed(2)}`;
            break;
        case /^(?!XAU|XNZ)(X\w{2,3})$/.test(countryCode): // Express excludes XAU or XNZ
            checkStatusMsg = 'Check status:Contact.sg@unicity.com';
            total = `-USD${parseFloat(cart.total).toFixed(2)}`;            
            break;
        case /XAU|AUS/.test(countryCode):
            checkStatusMsg = 'Check status:Contact.sg@unicity.com';
            total = `-AUD${parseFloat(cart.total).toFixed(2)}`;
            break;
        case /XNZ|NZD/.test(countryCode):
            checkStatusMsg = 'Check status:Contact.sg@unicity.com';
            total = `-NZD${parseFloat(cart.total).toFixed(2)}`;
            break;
        default:
            checkStatusMsg = '';
            total = '';
    }
    return `${subject} ${total} ${pv} ${ba} ${checkStatusMsg}`;
};

module.exports.createMobileNumber = (cart, countryCode) => {
    const first = cart.mobile.substr(0, 1);
    if (first === '0') {
        cart.mobile = cart.mobile.substr(1);
    }
    switch (countryCode) {
        case 'TH': return `+66${cart.mobile}`; break;
        case 'SG': return `+65${cart.mobile}`; break;
        case 'XAU': case 'AUS': return `+61${cart.mobile}`; break;
        case 'XNZ': case 'NZL': return `+64${cart.mobile}`; break;
        case 'XPH': return `+63${cart.mobile}`; break;
        case 'XMY': return `+60${cart.mobile}`; break;
        case 'XID': return `+62${cart.mobile}`; break;
        case 'XJP': return `+81${cart.mobile}`; break;
        case 'XHK': return `+852${cart.mobile}`; break;
        case 'XKR': return `+82${cart.mobile}`; break;
        default: return '';
    }
};
module.exports.validateConfirmationParams = (db, subject, body, mobile) => {
    const error = [];
    if (_.isEmpty(subject)) error.push('sms subject is empty.');
    if (_.isEmpty(body)) error.push('sms message is empty.');
    if (_.isEmpty(mobile)) error.push('sms mobile is empty.');
    if (smsLogModel.isDuplicatedMessage(db, subject, mobile)) {
        error.push('sms_subject is duplicate.')
    }
    return error;
};

module.exports.sendConfirmationMessage = async(db,
    referenceId, orderId, newId, cart, countryCode, paymentRecord, smsType) => {

    try {
        const subject = this.createConfirmationSubject(orderId);
        let message = this.createConfirmationMessage(orderId, newId, cart, countryCode);
        const mobile = this.createMobileNumber(cart, countryCode);
        const blacklist = ['+6581135496'];
        if (blacklist.includes(mobile)) return false;
    
        if (paymentRecord.type === 'shopping retail'
            || (paymentRecord.request_data.indexOf('share_cart_')!== -1 && paymentRecord.type === 'shopping profile')) {
            message += ' : Read company agreement at http://bit.ly/2T7p9NB';
        } else if (paymentRecord.type === 'enroll' && paymentRecord.request_data.indexOf('share_cart_')!== -1) {
            message += ' : Read company agreement at http://bit.ly/2YG4hfD';
        }
        const checkErrors = smsLogModel.isDuplicatedMessage(db, subject, mobile);
        if (!_.isEmpty(checkErrors)) {
            console.log('\nsmsHelper.sendConfirmationMessage', checkErrors);
            return checkErrors;
        }
        let sendResult = null;
        if (commonHelper.isProduction()) {
            sendResult = await apiHelper.sendSms(message, mobile);
        }
        console.log('\nsmsHelper.sendConfirmationMessage', smsType, subject, mobile, message, sendResult)
        await smsLogModel.create(db, referenceId, smsType, subject, mobile, message, sendResult);
        return [];

    } catch (error) {
        console.log('\nsmsHelper.sendConfirmationMessage', error.stack);
        return [error.message];
    }
};