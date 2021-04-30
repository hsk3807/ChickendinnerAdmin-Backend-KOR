module.exports.addWarning = function (result, msgType, msgKeyOfDictionary, data = []) {
    result.warning.push({
        type: msgType,
        messageKey: msgKeyOfDictionary,
        data: data
    })
}