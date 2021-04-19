const _ = require('lodash');
const { crc16ccitt } = require('crc');

module.exports.payloadTemplate = [
    {
        key: "releaseVersion",
        tag: "00",
        value: "01"
    },
    {
        key: "initialMethod",
        tag: "01",
        value: "12"
    },
    {
        key: "identifyMerchant",
        tag: "30",
        subTag: [
            {
                key: "aid",
                tag: "00",
                value: "A000000677010112"
            },
            {
                key: "billerId",
                tag: "01",
                value: "010554508882119"
            },
            {
                key: "reference1",
                tag: "02",
                value: "{{referenceId}}"
            }
        ]
    },
    {
        key: "currencyCode",
        tag: "53",
        value: "764"
    },
    {
        key: "amount",
        tag: "54",
        value: "{{amount}}"
    },
    {
        key: "countryCode",
        tag: "58",
        value: "TH"
    }
];

module.exports.getData = (referenceId, amount) => {
    let payloadJSON = JSON.stringify(this.payloadTemplate);
    payloadJSON = payloadJSON.replace('{{referenceId}}', referenceId);
    payloadJSON = payloadJSON.replace('{{amount}}', amount);
    return createQRData(JSON.parse(payloadJSON));
}
function createQRData (payload) {
    const qrDataChunk = payload.reduce(payloadProcess, []);
    console.log('qrDataChunk', qrDataChunk);
    const checkSum = createCheckSum(qrDataChunk.join(''));
    qrDataChunk.push(checkSum);
    return qrDataChunk.join('');
}
function payloadProcess (carry, each) {
    if (each.value && !each.subTag) {
        const tag = `${each.tag}${each.value.length.toString().padStart(2, '0')}${each.value}`;
        carry.push(tag);
    } else if (!each.value && each.subTag) {
        const subTag = each.subTag.reduce(payloadProcess, []);
        const len = subTag.join('').length.toString().padStart(2, '0');
        carry = carry.concat(each.tag, len, subTag);
    }
    return carry;
}
function createCheckSum(data) {
    const tag = '63'
    const len = '04'
    const input = `${data}${tag}${len}`
    const ccitt = crc16ccitt(input, 0xffff).toString(16).toUpperCase()
    return `${tag}${len}${ccitt}`
}