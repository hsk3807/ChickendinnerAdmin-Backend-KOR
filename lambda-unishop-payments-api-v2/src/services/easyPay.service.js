const axios = require('axios');
const qs = require('qs');
const { httpStatus, createServiceError } = require('../utils/helpers');

const get_etoken = () => {
  const hkey = 'A4E76BDA337DCCA95298FB495A84D369';

  try {
  } catch (err) {}
};

module.exports.pay = async (data) => {
  const defaultSndData = {
    sndCharset: 'utf-8',
    sndStoreid: '2999199999',
    sndMsalt: 'MA01',
    sndCurrencyType: '0',

    sndAmount: '1004',
    sndOrdernumber: 'KS',
    sndOrdername: '홍길동이',
    sndGoodname: '빵가게',
    sndEtoken: '',
    sndEdata: '',
  };
  const postData = {
    ...defaultSndData,
    ...data,
  };

  return postData;

  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    data: qs.stringify({ data: JSON.stringify(postData) }),
    url: `http://210.181.28.134/store/PAY_PROXY/api001/cardauth.jsp`,
  };

  const res = await axios(options);
  const { status, data = {} } = res;

  console.log('res : ', res);

  if (status === 200 && data.success) {
    return data;
  } else {
    return createServiceError(httpStatus.badRequest, `Login failed.`);
  }
};
