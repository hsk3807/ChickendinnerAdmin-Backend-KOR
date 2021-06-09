const { Base64 } = require('js-base64');
// var Buffer = require('buffer').Buffer;
// var Iconv = require('iconv').Iconv;
// var assert = require('assert');
let iconv = require('iconv-lite');
var sha256 = require('js-sha256').sha256;
const crypto = require('crypto');

const buildUrl = (url, parameters) => {
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
};

const base64Enc = (text) => {
  return Base64.encode(text);
};

const base64Dec = (text) => {
  return Base64.decode(text);
};

const utf8ToeucKr = (str) => {
  var iconv = new Iconv('utf-8', 'euc-kr');
  var buf = new Buffer(str, 'binary');
  return iconv.convert(buf).toString();
};

const eucKrToUtf8 = (str) => {
  var iconv = new Iconv('euc-kr', 'utf-8');
  var buf = new Buffer(str, 'binary');
  return iconv.convert(buf).toString();
};

const euckrEnc = (str) => {
  let euckrStr = iconv.encode(str, 'euc-kr');
  return euckrStr;
};
const euckrDec = (str) => {
  let euckrStr = iconv.decode(str, 'euc-kr');
  return euckrStr;
};

const getFullDate = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  let mm = d.getMonth() + 1;
  let dd = d.getDate();
  let hour = d.getHours();
  let min = d.getMinutes();
  let sec = d.getSeconds();
  if (mm < 10) mm = '0' + mm;
  if (dd < 10) dd = '0' + dd;
  if (hour < 10) hour = '0' + hour;
  if (min < 10) min = '0' + min;
  if (sec < 10) sec = '0' + sec;

  return [yyyy, mm, dd, hour, min, sec].join('');
};

const getFullDate2 = (d) => {
  const yyyy = d.getFullYear();
  let mm = d.getMonth() + 1;
  let dd = d.getDate();
  let hour = d.getHours();
  let min = d.getMinutes();
  let sec = d.getSeconds();
  if (mm < 10) mm = '0' + mm;
  if (dd < 10) dd = '0' + dd;
  if (hour < 10) hour = '0' + hour;
  if (min < 10) min = '0' + min;
  if (sec < 10) sec = '0' + sec;

  return [yyyy, mm, dd].join('-') + ' ' + [hour, min, sec].join(':');
};

const get_etoken = (mkey, curr_date_14, sign_msg) => {
  try {
    let ptoken = curr_date_14 + ':' + mkey;
    if (sign_msg != null) ptoken = ptoken + sign_msg;

    var hash = sha256.create();
    hash.update(ptoken);

    return curr_date_14 + ':' + hash.hex();
  } catch (err) {
    console.log('err : ', err);
  }
};

const hex_encode = (bytes) => {
  if(!bytes) return null;
}

const hex_decode = (sStr) => {
  if (!sStr) return null;

  const slen = sStr.length;
  if (0 == slen || 0 != slen % 2) return null;

  var buffer = new ArrayBuffer(slen / 2);
  for (var i = 0, j = 0; i < slen; i += 2, j++) {


    let hex_string = sStr.substring(i, i + 2);

    hex_string =
      hex_string.charAt(1) != 'X' && hex_string.charAt(1) != 'x'
        ? (hex_string = '0X' + hex_string)
        : hex_string;
    hex_string =
      hex_string.charAt(2) < 8
        ? (hex_string = hex_string - 0x00)
        : (hex_string = hex_string - 0xff - 1);
    buffer[j] = hex_string;
    
  }

  return buffer;
};

const string_to_bytes = (str) => {
  var bytes = [];
  for(var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      bytes.push(char >>> 8);
      bytes.push(char & 0xFF);
  }
  return bytes;

}
const encrypt_msg = (mekey, msg) => {
  if (!msg || msg.length === 0) return;

  try {
    // const kbytes = hex_decode(mekey, true); // secretkey로 사용
    const iv = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);

    const mbytes = string_to_bytes(msg); //암호화할 데이터

    console.log('aes-128-cbc', mekey, iv);
    const cipher  = crypto.createCipheriv('aes-128-cbc', Buffer.from(mekey, 'utf-8'), iv);
    let ebytes = cipher.update(mbytes, 'utf8', 'base64')
    ebytes += cipher.final('base64');

    console.log(ebytes);
    // return hex_encode(ebytes);

  } catch (err) {
    console.log("err : ", err);
  }
};

const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

module.exports = {
  buildUrl,
  base64Enc,
  base64Dec,
  eucKrToUtf8,
  utf8ToeucKr,
  euckrEnc,
  euckrDec,
  getFullDate,
  getFullDate2,
  get_etoken,
  encrypt_msg,
  numberWithCommas,
};
