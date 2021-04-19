const _ = require("lodash")

module.exports.isValidResult = function (result) {
    return (
        true &&
        _.isObject(result) &&
        _.isArray(result.items) &&
        result.items.length > 0 &&
        _.isArray(result.items[0].lines.items) &&
        result.items[0].lines.items.length > 0
    )
}
module.exports.getItem = function (result, itemCode) {
    if (!module.exports.isValidResult(result) || _.isEmpty(itemCode))
        return null
    return result.items[0].lines.items.find((each) => {
        return each.item.id.unicity === itemCode
    })
}
