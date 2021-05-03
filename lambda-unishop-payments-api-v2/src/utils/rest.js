const request = require('./request');
const Config = require('../env');
const qs = require('qs');

function toCamelCase(str) {
  return str
    .split(' ')
    .map(function (word, index) {
      // If it is the first word make sure to lowercase all the chars.
      if (index == 0) {
        return word.toLowerCase();
      }
      // If it is not the first word only upper case the first char and lowercase the rest.
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

function buildUrl(url, parameters) {
  let _qs = '';
  for (const key in parameters) {
    if (parameters.hasOwnProperty(key)) {
      const value = parameters[key];
      _qs += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
    }
  }
  if (_qs.length > 0) {
    _qs = _qs.substring(0, _qs.length - 1); //chop off last "&"
    url = url + '?' + _qs;
  }

  return url;
}

const requestUnifoApiAsync = (path, method, params, isForm = false) => {
  return new Promise(async function (resolve, reject) {
    const unifoApi = Config.unifoApiPath;
    var requestURL = undefined;

    let options = {
      credentials: 'include',
      headers: {
        Accept: '*/*',
        'content-type': 'application/json',
      },
      method,
    };

    if (method == 'GET') {
      requestURL = buildUrl(unifoApi + path, params);
    } else {
      requestURL = unifoApi + path;
      options.url = requestURL;

      if (isForm) {
        const formData = new FormData();

        for (var k in params) {
          formData.append(k, params[k]);
        }

        options.data = formData;
      } else options.data = params;
    }

    if (
      process.env !== 'production' &&
      requestURL.indexOf('action=getAlarmConfirmList') === -1
    ) {
      // console.log('#### api call : ', requestURL);
      // console.log('#### api options : ', options);
    }
    request(requestURL, options)
      .then((res) => {
        var data = undefined;
        if (res.data) data = res.data;
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = {
  requestUnifoApiAsync,
};
