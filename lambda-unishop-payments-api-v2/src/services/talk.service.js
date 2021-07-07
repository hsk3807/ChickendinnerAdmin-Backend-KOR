const { requestUnifoApiAsync } = require('../utils/rest');
const axios = require('axios');
const qs = require('qs');
const { httpStatus, createServiceError } = require('../utils/helpers');
const Config = require('../env');
const { TALK_TEMPLATE_TYPE } = require('../utils/Constants');

const getCode = (template_code) => {
  let code = undefined;
  if (template_code === TALK_TEMPLATE_TYPE.VIRTUAL_ACCOUNT) code = 'SJT_060974';
  else if (template_code === TALK_TEMPLATE_TYPE.ACCOUNT_LINK)
    code = 'SJT_061493';  //SJT_061493
  else code = 'SJT_061047';

  return code;
};
/**
 * @description 알림 톡
 * @param {string} dstaddr 연락처 01011112222
 * @param {string} variable 내용
 * @param {string} template_code code
 */
const send = async (props) => {
  const { dstaddr, variable, template_code } = props;
  //http://member-kr.unicity.com/unifoapi/v1/KR/payment/request/alimtalk?dstaddr=010925150578
  const url = '/payment/request/alimtalk';
  const res = await requestUnifoApiAsync(url, 'POST', {
    dstaddr,
    variable,
    template_code: getCode(template_code),
  });
  return res;
};

const TalkService = {
  send,
};

module.exports = TalkService;
