const _ = require('lodash');
// const db = require('helper/db');
const Utils = require('./helper/utils')
const PaymentLog = require('./model/payment_log')

exports.lambdaHandler = async (event, context) => {

    const stage = Utils.getDeployStage(event);

    try {
        switch (event.path) {
            case '/log/create':
                return await logCreate(stage, event);
                break;

            case '/log/get/posttopayment':  
                return await logGetPostToPayment(stage, event);
                break;
            default:
                return Utils.createResponseError('invalid_path');
        }
    } catch (e) {
        console.log(e.stack);
        return Utils.createResponseError(e.message);
    }

};
async function logCreate(stage, event)
{
    const postData = JSON.parse(event.body);
    const err = PaymentLog.checkCreatedValidation(postData);
    if (err) {
        return Utils.createResponseError(err);
    }
    const log = await PaymentLog.get(stage, postData);
    if (_.isEmpty(log)) {
        const result = await PaymentLog.create(stage, postData);
    } else {
        const result = await PaymentLog.update(stage, postData);
    }
    return Utils.createResponse(postData);
}
async function logGetPostToPayment(stage, event)
{
    const postData = JSON.parse(event.body);
    if (_.isEmpty(postData.reference_id)) {
        return Utils.createResponseError('invalid_reference_id');
    }
    postData.log_type = 'post to payment';
    const log = await PaymentLog.get(stage, postData);
    if (_.isEmpty(log)) {
        return Utils.createResponse(null);
    }
    const record = log.Item.request_data.pop();
    if (_.isEmpty(record) || _.isEmpty(record.data)) {
        return Utils.createResponse(null);
    }
    return Utils.createResponse(JSON.parse(record.data));
}