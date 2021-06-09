const { requestAsync } = require('../utils/rest');
const axios = require('axios');
const qs = require('qs');
const Config = require('../env');

/** @ ==>  _ 로 치환 */
const serviceName = 'ksnet@token';

/**
 * @description 유저 Mypay ServiceToken 조회
 */
const loadUserServiceToken = async (params) => await requestAsync(`LOAD_${serviceName.toUpperCase()}`, params)

const PayService = {
  loadUserServiceToken,
};

module.exports = PayService;
