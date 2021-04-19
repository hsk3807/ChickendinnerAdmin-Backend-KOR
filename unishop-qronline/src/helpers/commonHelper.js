'use strict';

const AWS = require('aws-sdk');
const crypto = require('crypto')

module.exports.getStage = () => {
    return process.env.STAGE;
};
module.exports.getAppRequestId = (context) => {
    return context.awsRequestId;
};
module.exports.isProduction = () => {
    return this.getStage() === 'prod';
};
module.exports.isLocal = () => {
    return this.getStage() === 'local';
};
module.exports.isDev = () => {
    return this.getStage() === 'dev';
};

module.exports.getHostname = (event) => {
    return event.headers.Host.split(':')[0];
};

module.exports.getQueryString = (event, field = null) => {
    if (field) {
        return event.queryStringParameters[field];
    } else {
        return event.queryStringParameters
    }
};
module.exports.unmarshall = (dynamoDBObj) => {
    return AWS.DynamoDB.Converter.unmarshall(dynamoDBObj);
};
module.exports.base64_encode = (str) => {
    return Buffer.from(str).toString('base64')
};
module.exports.isOneOfTestAccount = (baId) => {
    const testAccounts = ['108357166', '98767565', '101041581', '421035784', '102460881'];
    return testAccounts.includes(baId);
};

module.exports.rawurlencode = (str) => {
    str = (str + '');
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
};
module.exports.bin2hex = (s) => {  
    var i
    var l
    var o = ''
    var n
  
    s += ''
  
    for (i = 0, l = s.length; i < l; i++) {
      n = s.charCodeAt(i)
        .toString(16)
      o += n.length < 2 ? '0' + n : n
    }
  
    return o
}
module.exports.createHashHref = (id, hrefType) => {
    const text = hrefType === 'customer'? 'unicity': hrefType === 'order'? 'infotrax': ''
    if (text === '') return ''
    const iv = new Buffer.alloc(16);
    const key = "d8578edf8458ce06fbc5bb76a58c5ca4";
    const cypher = crypto.createCipheriv("aes-256-cbc", key, iv);
    cypher.setAutoPadding(false);
    let input = Buffer.from(`?${text}=${id}`, "ascii");
    let len = Math.ceil(input.length / 16) * 16;
    let max = Buffer.alloc(len, 0);
    let dec = cypher.update(Buffer.concat([input, max], len));
    dec = Buffer.concat([dec, cypher.final()]);
    return dec.toString("hex");    
}
module.exports.createHashCustomerHref = (baId) => {
    return this.createHashHref(baId, 'customer')
}
module.exports.createHashOrderHref = (orderIdIncludeCountryCode) => { // 81-444444444
    return this.createHashHref(orderIdIncludeCountryCode, 'order')
}
