const _ = require('lodash')
const countryConfig = require('../config/country')

module.exports.findMatchCountry = function (market, shipToCountry) {
    if (
        false ||
        _.isEmpty(market) ||
        _.isEmpty(shipToCountry) ||
        !_.isString(market) ||
        !_.isString(shipToCountry)
    )
        return null

    return countryConfig.find(
        (each) =>
            each.market.toUpperCase() === market &&
            each.shipToCountry.toUpperCase() === shipToCountry
    )
}

module.exports.getWarehouseName = function (market, shipToCountry) {
    const matchCountry = module.exports.findMatchCountry(market, shipToCountry)
    if (_.isEmpty(matchCountry)) return null
    return matchCountry.warehouseName
}

module.exports.getPromotions = function (market, shipToCountry) {
    const matchCountry = module.exports.findMatchCountry(market, shipToCountry)
    if (_.isEmpty(matchCountry) || _.isEmpty(matchCountry.promotions)) return []
    return matchCountry.promotions
}

module.exports.getStarterKitItemCode = function (market, shipToCountry) {
    const matchCountry = module.exports.findMatchCountry(market, shipToCountry)
    if (_.isEmpty(matchCountry)) return null
    return matchCountry.starterKitItemCode
}

module.exports.getCountryCode3 = function (market, shipToCountry) {
    const matchCountry = module.exports.findMatchCountry(market, shipToCountry)
    if (_.isEmpty(matchCountry)) return null
    return matchCountry.countryCode3letters
}

module.exports.getTimezone = function (market, shipToCountry) {
    const matchCountry = module.exports.findMatchCountry(market, shipToCountry)
    if (_.isEmpty(matchCountry) || _.isEmpty(matchCountry.promotions))
        return null
    return matchCountry.timezone
}
