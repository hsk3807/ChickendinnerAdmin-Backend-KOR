
const _ = require('lodash')
const UtilsService = require('../services/utils.service')
// const UnishopPayment = require('../models/unishop_payment.model');

module.exports.getRequestData = async(req, res, next) => {
    try {

        const connection = UtilsService.getConnection()
        const referenceId = UtilsService.base64_decode(req.params.referenceId)
        const sql = "SELECT * FROM unishop_payment WHERE reference_id = ? AND order_id = ''"
        const result = await connection.query(sql, { replacements: [referenceId], type: connection.QueryTypes.SELECT })
        // const result = await UnishopPayment.findOne({where: {reference_id: referenceId, order_id: ''}})
        if (_.isEmpty(result)) {
            res.status(400)
            throw new Error('payment_data_not_found')
        }
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1);
        if (result[0].stamp_created < yesterday) {
            res.status(400)
            throw new Error('data_expired')
        }
        res.json(UtilsService.responseSuccess(JSON.parse(removePromotionItem(result[0].request_data))))
    } catch (error) {
        UtilsService.errorHandler(error, req, res, next)
    }
}
function removePromotionItem (requestData) {
    const obj = JSON.parse(requestData)
    const promoItems = ['31109']
    obj.orderData.items = obj.orderData.items.filter( each => !promoItems.includes(each.item_code) )
    obj.orderData.hydra.lines.items = obj.orderData.hydra.lines.items.filter( each => !promoItems.includes(each.item_code) )
    return JSON.stringify(obj)
}