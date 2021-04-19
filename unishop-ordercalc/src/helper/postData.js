module.exports.getShipToCountry = function (postData) {
    return postData.order.shipToAddress.country
}
module.exports.getMarket = function (postData) {
    return postData.order.market || module.exports.getShipToCountry(postData)
}