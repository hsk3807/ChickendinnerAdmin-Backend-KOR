'use strict';

const _ = require('lodash');
const axios = require('axios');
const stringify = require('json-stringify-safe')
const commonHelper = require('../helpers/commonHelper');

module.exports.test = () => {
    const url = 'https://hydra.unicity.net/'+process.env.HYDRA_VERSION+'/customers?unicity=108357166';
    return axios.get(url);
};
module.exports.CONFIG = {
    ADMIN_TOKEN1: 'th_batch_import:VpmnhMjXTQ2TnSqYZZqSNZZd4ku3ZwacxkncwwMr'
}
module.exports.getHydraDomain = () => {
    const stage = commonHelper.getStage();
    let domain = 'https://hydra.unicity.net/' + process.env.HYDRA_VERSION;
    if (stage === 'dev' || stage === 'local') {
        domain += '-test';
    }
    return domain;
}
module.exports.login = (loginType, value, token = '') => {
    const data = {
        type: loginType,
        value: value,
        namespace: this.getHydraDomain() + '/customers'
    }
    const hydraApi = this.getHydraDomain() + '/loginTokens';
    const headers = {
        'Content-Type': 'application/json;charset=UTF-8'
    }
    if (!_.isEmpty(token)) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return axios({
        method: 'POST',
        url: hydraApi,
        headers: headers,
        data: data
    });
};
module.exports.employeeLogin = (baId, baPassword) => {
    const data = {
        type: 'base64',
        value: commonHelper.base64_encode(`${baId}:${baPassword}`),
        namespace: this.getHydraDomain() + '/employees'
    }
    const hydraApi = this.getHydraDomain() + '/loginTokens';
    const headers = {
        'Content-Type': 'application/json;charset=UTF-8'
    }
    return axios({
        method: 'POST',
        url: hydraApi,
        headers: headers,
        data: data
    });
};
module.exports.plainLogin = (baId, baPassword) => {
    return this.login('plain', `${baId}:${baPassword}`);
}
module.exports.secureLogin = (baId, baPassword) => {
    return this.login('base64', commonHelper.base64_encode(`${baId}:${baPassword}`));
};
module.exports.refreshBAToken = async(token) => {
    try {
        const result = await this.login('loginToken', token, token);
        return result.data.token;        
    } catch (error) {
        console.log('refreshBAToken',error.stack);
        return null;
    }
};
module.exports.getBAToken = async(baId, baPassword) => {
    try {
        const result = await this.secureLogin(baId, baPassword);
        return result.data.token;
    } catch (error) {
        console.log('getBAToken',error.stack);
        return null;
    }
};
module.exports.getTestAccountOfBAToken = async(baId) => {
    return await this.getBAToken(baId, '1234');
};
module.exports.post = async(callerName, hydraApi, postData, token = null) => {
    try {
        console.log(`fire > ${callerName}.post\n`, hydraApi, '\n');
        let headers = { 'Content-Type': 'application/json;charset=UTF-8' };
        if (!_.isEmpty(token)) headers['Authorization'] = `Bearer ${token}`;
        const result = await axios({
            method: 'POST',
            url: hydraApi,
            headers: headers,
            data: postData
        });
        console.log(`result > ${callerName}.post\n`, hydraApi, '\n',
            stringify(postData), '\n', stringify(result.config.headers), '\n', stringify(result.headers));
        return [result.data, result.config.headers, result.headers, true];

    } catch (error) {
        console.log(`error > ${callerName}.post\n`, error.stack);
        if (error.hasOwnProperty('config') && error.hasOwnProperty('response')) {
            console.log(error.config.url, '\n', stringify(error.response.data),'\n',
                stringify(error.config.headers), '\n', stringify(error.headers))
        } else {
            error.response = { data: null }
            error.config = { headers: null }
            error.headers = null
        }
        return [error.response.data, error.config.headers, error.headers, false];  
    }
};
module.exports.createOrderWithLogin = async(postData, token) => {
    const hydraApi = `${this.getHydraDomain()}/customers/me/orders`;
    return await this.post('createOrderWithLogin', hydraApi, postData, token);
};
module.exports.createOrderWithEnroll = async(postData) => {
    const hydraApi = `${this.getHydraDomain()}/orders`;
    return await this.post('createOrderWithEnroll', hydraApi, postData);
};
module.exports.createOrderWithoutLogin = async(postData) => {
    const hydraApi = `${this.getHydraDomain()}/orders`;
    return await this.post('createOrderWithoutLogin', hydraApi, postData);
};
module.exports.createOrderWithPOS = async(postData, token) => {
    const hydraApi = `${this.getHydraDomain()}/orders`;
    return await this.post('createOrderWithPOS', hydraApi, postData, token);
};
module.exports.getCustomerInfoByBaId = async(baId, token) => {
    try {
        const hydraApi = `${this.getHydraDomain()}/customers?id.unicity=${baId}&expand=customer`;
        const headers = {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': `Bearer ${token}`
        }
        const result = await axios({
            method: 'GET',
            url: hydraApi,
            headers: headers
        });
        console.log('getCustomerInfoByBaId', hydraApi, stringify(result.data))
        return result.data.items[0];
    } catch (error) {
        console.log('getCustomerInfoByBaId', error.stack)
        return error.response.data
    }
};
