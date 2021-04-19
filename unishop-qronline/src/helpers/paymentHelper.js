'use strict';

const _ = require('lodash');
const hydraHelper = require('../helpers/hydraHelper');
const apiHelper = require('../helpers/apiHelper');
const commonHelper = require('../helpers/commonHelper');

module.exports.status = {
    success: 'payment_success',
    pending: 'payment_pending',
    fail: 'payment_failed'
}
module.exports.message = {
    success: 'payment success',
    fail: 'payment failed'
}
module.exports.getLogType = (shoppingType) => {
    const logType = [];
    logType['enroll'] = 'hydra enroll';
    logType['shopping login'] = 'hydra order login';
    logType['shopping retail'] = 'hydra order not login';
    logType['shopping anonymous'] = 'hydra order anonymous';
    if (logType.hasOwnProperty(shoppingType)) {
        return logType[shoppingType];
    }
    return shoppingType;
};
module.exports.concatUrlParams = (baseUrl, params) => {
    if (_.isString(params)) { return `${baseUrl}?${params}` };
    if (_.isArray(params)) {
        return params.reduce( (carry, each, index) => {
            if (index === 0) {
                return carry += `?${each}`;
            } else {
                return carry += `&${each}`;
            }
        }, baseUrl);
    }
    return baseUrl;
};
module.exports.getOrderData = (paymentRecord) => {
    const obj = JSON.parse(paymentRecord.request_data);
    return obj.orderData;
}
module.exports.removeCountryCodeFromOrderId = (orderId) => {
    if (_.isEmpty(orderId)) return '-';
    if (/^[0-9]{2}-\d+/.test(orderId)) {
        return orderId.split('-')[1];
    }
    return orderId;
}
module.exports.getBaTokenByPaymentRecord = async(paymentRecord) => {
    try {
        if (commonHelper.isOneOfTestAccount(paymentRecord.login_id)) {
            return await hydraHelper.getTestAccountOfBAToken(paymentRecord.login_id);
        }
        let currentToken = paymentRecord.token;
        if (_.isEmpty(currentToken)) {
            const orderData = this.getOrderData(paymentRecord.request_data);
            currentToken = orderData.token;
        }
        if (_.isEmpty(currentToken)) return null;
        return await hydraHelper.refreshBAToken(currentToken);        
        
    } catch (error) {
        console.log('getBaTokenByPaymentRecord', error.stack);
        return null;
    }
};
module.exports.getEmployeeToken = async() => {
    try {
        const result = await hydraHelper.employeeLogin('ushopth','F0rsup3rtok3n');      
        return result.data.token;
    } catch (error) {
        console.log('getEmployeeToken', error.stack);
        return null;
    }
};
module.exports.fakeApproveCode = (hydraData) => {
    if (hydraData.transactions.items[0].authorization) {
        hydraData.transactions.items[0].authorization = '123456'
    }
}
module.exports.prepareHydraData = (paymentRecord) => {
    const requestData = JSON.parse(paymentRecord.request_data);
    const hydraData = requestData.orderData.hydra;
    if (!_.isObject(hydraData)) {
        return hydraData;
    }

    if (hydraData.hasOwnProperty('customer') && hydraData.customer.hasOwnProperty('enroller')) {
        const token = hydraData.customer.enroller.href.split('=');
        hydraData.customer.enroller.href = `${hydraHelper.getHydraDomain()}/customers?id.unicity=${token[1]}`;
    }

    if (hydraData.hasOwnProperty('customer') && hydraData.customer.hasOwnProperty('sponsor')) {
        const token = hydraData.customer.sponsor.href.split('=');
        hydraData.customer.sponsor.href = `${hydraHelper.getHydraDomain()}/customers?id.unicity=${token[1]}`;
    }
    
    if (hydraData.hasOwnProperty('customer') && hydraData.customer.hasOwnProperty('href')) {
        const token = hydraData.customer.href.split('=');
        hydraData.customer.href = `${hydraHelper.getHydraDomain()}/customers?id.unicity=${token[1]}`;
    }    

    if (hydraData.lines.items && _.isArray(hydraData.lines.items)) {
        hydraData.lines.items = hydraData.lines.items.map( each => {
            each.item.href = `${hydraHelper.getHydraDomain()}/items?${each.href_params}`;
            return each;
        })
    }
 
    if (hydraData.shippingMethod.href && _.isString(hydraData.shippingMethod.href)) {
        hydraData.shippingMethod.href = this.concatUrlParams(`${hydraHelper.getHydraDomain()}/shippingmethods`, hydraData.shippingMethod.href_params);
    }

    hydraData.notes += paymentRecord.reference_id;
    hydraData.notes += `|${requestData.orderData.type}`;
    if (paymentRecord.request_data.indexOf('StoreCredit') !== -1) {
        hydraData.notes += '|ar_balance';
    }
    if (!_.isEmpty(requestData.orderData.comment)) {
        hydraData.shipToAddress.city += ` (${requestData.orderData.comment})`;
    }
    this.fakeApproveCode(hydraData);
    return hydraData;
};
module.exports.getShareProfileId = (paymentRecord) => {
    const obj = JSON.parse(paymentRecord.request_data);
    if (obj.orderData.hasOwnProperty('share_profile_id')) {
        return obj.orderData.share_profile_id;
    } else {
        return null;
    }
}
module.exports.saveShareCartStat = async(paymentRecord) => {
    const shareACardProfileId = this.getShareProfileId(paymentRecord);
    if (!_.isEmpty(shareACardProfileId)) {
        await apiHelper.updateCountStatShop(shareACardProfileId)
    }
}
module.exports.createOrder = async(paymentRecord, createHandler, useToken = false) => {
    const postDataToHydra = this.prepareHydraData(paymentRecord);
    const [responseData, requestHeader, responseHeader, success] = await createHandler(postDataToHydra, useToken? paymentRecord.token: null);
    if (success && responseData.id.unicity) {
        return {
            status: 'success',
            resultSuccess: responseData,
            resultError: [],
            postDataToHydra: postDataToHydra,
            requestHeader: requestHeader,
            responseHeaderFromHydra: responseHeader
        }
    } else {
        return {
            status: 'error',
            resultSuccess: [],
            resultError: responseData,
            postDataToHydra: postDataToHydra,
            requestHeader: requestHeader,
            responseHeaderFromHydra: responseHeader
        }
    }
};

module.exports.createOrderWithLogin = async(paymentRecord) => {
    return await this.createOrder(paymentRecord, hydraHelper.createOrderWithLogin, true);
};
module.exports.createOrderWithEnroll = async(paymentRecord) => {
    return await this.createOrder(paymentRecord, hydraHelper.createOrderWithEnroll, false);
};
module.exports.createOrderWithPOS = async(paymentRecord) => {
    return await this.createOrder(paymentRecord, hydraHelper.createOrderWithPOS, true);
};
module.exports.createOrderWithoutLogin = async(paymentRecord) => {
    return await this.createOrder(paymentRecord, hydraHelper.createOrderWithoutLogin, false);
};
module.exports.getTotalFromOrderTerm = (paymentRecord) => {
    const requestData = JSON.parse(paymentRecord.request_data);
    const orderTerms = requestData.orderData.orderTerms;
    if (!_.isObject(orderTerms)
        || !orderTerms.hasOwnProperty('items')
        || !_.isArray(orderTerms.items)
        || orderTerms.items.length !== 1
        ) {
        return [null, false];
    }
    if (orderTerms.items[0].terms.total) {
        return [orderTerms.items[0].terms.total, true];
    } else {
        return [null, false];
    }
};
module.exports.getAmountFromPaymentReturn = (paymentRecord) => {
    const data = JSON.parse(paymentRecord.return_payment_data);
    if (_.isEmpty(data)) {
        return [null, false];
    }
    if (data.amount) {
        return [parseFloat(data.amount), true];
    } else {
        return [null, false];
    }
};
module.exports.checkMatchTotalAndAmount = (paymentRecord) => {
    const [total, totalSuccess] = this.getTotalFromOrderTerm(paymentRecord);
    const [amount, amountSuccess] = this.getAmountFromPaymentReturn(paymentRecord);
    return [totalSuccess && amountSuccess && total === amount, total, amount];
}

module.exports.skipCheckMatchTotalAndAmount = (paymentRecord) => {
    const requestData = JSON.parse(paymentRecord.request_data);
    return requestData.orderData.skip_check_match_totaL_and_amount;
}