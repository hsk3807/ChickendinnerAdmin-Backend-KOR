const { requestUnifoApiAsync } = require('../utils/rest');
const axios = require('axios');
const qs = require('qs');
const { httpStatus, createServiceError } = require('../utils/helpers');
const Config = require('../env');

/**
 * @description 주문 정보
 * @param {string} referenceId refId
 */
const loadOrderDetail = async (referenceId) => {
  //http://member-kr.unicity.com/unifoapi/v1/KR/payment/request/alimtalk?dstaddr=010925150578
  const url = '/payment/request/paydetail';
  const res = await requestUnifoApiAsync(url, 'POST', {
    referenceId,
  });
  return res;
};

/**
 * @description 가상 계좌 발급 완료 후 저장 하는 API
 */
const updateVbank = async (params) => {
  const url = '/payment/request/vbank';
  const res = await requestUnifoApiAsync(url, 'POST', {
    ...params,
  });
  return res;
};

/**
 * @description 통합모듈 카드 결제 완료 후 저장 하는 API
 */
const updateUpay = async (params) => {
  const url = '/payment/request/upay';
  const res = await requestUnifoApiAsync(url, 'POST', {
    ...params,
  });
  return res;
};

/**
 * @description Mypay 카드 결제 완료 후 저장 하는 API
 */
const updateMypay = async (params) => {
  const url = '/payment/request/mypay';
  const res = await requestUnifoApiAsync(url, 'POST', {
    ...params,
  });
  return res;
};
/**
 * @description 간편결제
 */
const easyPay = async (params) => {
  const url = '/payment/request/orderpay';
  const result = await requestUnifoApiAsync(url, 'POST', params);
  return result;
};

const PayService = {
  easyPay,
  loadOrderDetail,
  updateVbank,
  updateUpay,
  updateMypay,
};

module.exports = PayService;
