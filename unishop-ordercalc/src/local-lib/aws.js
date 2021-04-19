const AWS = require('aws-sdk');
const ssm = new AWS.SSM()

module.exports.ssmGet = function (fieldName, WithDecryption = false) {
    const params = {
        Name: fieldName,
        WithDecryption: WithDecryption
    } 
    return new Promise(promiseHandler)

    function promiseHandler (resolve, reject) {
        ssm.getParameter(params, function (err, data) {
            if (err) {
                console.log('ssmGet Error', err, err.stack)
                reject(err)
            } else {
                resolve(data)
            }
        })
    }
}

module.exports.ssmFind = function (configPath, WithDecryption = false) {
    const params = {
        Path: configPath,
        WithDecryption: WithDecryption
    }
    return new Promise(promiseHandler)

    function promiseHandler (resolve, reject) {
        ssm.getParametersByPath(params, function (err, data) {
            if (err) {
                console.log('ssmFind Error', err, err.stack)
                reject(err)
            } else {
                resolve(data)
            }
        })
    }
}