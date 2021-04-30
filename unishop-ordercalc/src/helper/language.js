const _ = require('lodash')
const stringify = require('json-stringify-safe')
const axios = require('axios');
const { ENABLE_CURLIRIZE_LOG } = require('../config/app');

module.exports.getDictionary = async function (lang) {
    const api = `https://member-calls.unicity.com/api/unishop/v1/global/translations/${lang}`
    try {
        const result = await axios({
            method: 'GET',
            url: api,
            curlirize: ENABLE_CURLIRIZE_LOG
        });
        console.log('\getDictionary\n', stringify(result.data['language']))
        return result.data
    } catch (error) {
        console.log('\getDictionary\n', error.stack)
        return error.response.data
    }
}

