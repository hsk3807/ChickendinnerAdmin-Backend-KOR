'use strict';

const _ = require('lodash');
const axios = require('axios');
const commonHelper = require('../helpers/commonHelper');


module.exports.getMemberCallsDomain = () => {
    const stage = commonHelper.getStage();
    if (stage === 'local') {
        return 'http://localhost:8888';
    } else {
        return 'https://member-calls.unicity.com';
    }
};
module.exports.getBaseMemberCallsUrl = () => {
    const stage = commonHelper.getStage();
    let url = `${this.getMemberCallsDomain()}/api/unishop`;
    if (commonHelper.isDev()) {
        url += '_dev';
    }
    return url;
};
module.exports.getMemberCallsToken = () => {
    if (commonHelper.isProduction()) {
        return 'ThkGYVToaj7nM'
    } else if (commonHelper.isLocal()) {
        return 'ThWxqdrfrv6o2';
    } else {
        return 'ThgaYG6lcqCdI';
    }
}
module.exports.resendConfirmationEmail = async(countryCode, referenceId) => {
    const stage = commonHelper.getStage();
    try {
        const memberCallsApi = `${this.getBaseMemberCallsUrl()}/v1/${countryCode}/payment/confirmOrderEmail`;
        const memberCallsToken = this.getMemberCallsToken();
        const data = {
            reference_id: referenceId,
            token: memberCallsToken
        };
        const headers = {
            'Content-Type': 'application/json;charset=UTF-8'
        }
        console.log('\nresendConfirmationEmail', memberCallsApi, data)
        return await axios({
            method: 'POST',
            url: memberCallsApi,
            headers: headers,
            data: data
        });         

    } catch (error) {
        console.log('\nresendConfirmationEmail', error.stack);  
    };
};
module.exports.sendSms = async(message, toMobile) => {

    try {
        const pMobile = commonHelper.rawurlencode(toMobile);
        const pMessage = commonHelper.rawurlencode(message) + (!commonHelper.isProduction()? ' (testing)': '');        
        const api = 'https://member-calls.unicity.com/ALL/SMS/ALL_SMS.php';
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        const data = `smsMobile=${pMobile}&smsMSG=${pMessage}`; //"smsMobile=$pSmsMobile&smsMSG=$pSmsMSG";
        return await axios({
            method: 'POST',
            url: api,
            headers: headers,
            data: data
        });        
    } catch (error) {
        console.log('sendSms', error.stack);
        return null;
    }
};
module.exports.updateCountStatShop = async(profileId) => {
    try {
        const api = 'https://member-calls.unicity.com/shopprofile/api/shopprofile.php';
        const headers = {
            'Content-Type': 'application/json;charset=UTF-8'
        }
        const data = {
            action: countStatShop,
            profileID: profileId
        };        
        return await axios({
            method: 'POST',
            url: api,
            headers: headers,
            data: data
        });          
    } catch (error) {
        console.log('updateCountStatShop', error.stack)
    }
};