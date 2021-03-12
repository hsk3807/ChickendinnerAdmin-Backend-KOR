const axios = require('axios');
const { utilsHelper } = require('lib-utils');
const { formatErrorService } = utilsHelper;
module.exports.saveLog = async (message, response, url) => {
  try {
    let res = await axios({
      method: 'post',
      url: 'https://member-calls2-kr.unicity.com/unishop-fn-misc/log',
      headers: { 'Content-Type': 'application/json' },
      data: {
        message: message,
        response: response,
        url: url,
      },
    });
    return res.data;
  } catch (err) {
    console.log('err', err);
    throw err;
  }
};

module.exports.formatCurl = (data) => {
  let data_f = data;
  let curl_mock = data_f.curl;
  let string = '';

  for (let i = 0; i < curl_mock.length; i++) {
    if (curl_mock.charAt(i) === '[') {
      string += '\\' + curl_mock.charAt(i);
      continue;
    } else if (curl_mock.charAt(i) === ']') {
      string += '\\' + curl_mock.charAt(i);
      continue;
    }
    string += curl_mock.charAt(i);
  }

  data_f.curl = string;

  return string;
};
