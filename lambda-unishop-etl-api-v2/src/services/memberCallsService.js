const axios = require('axios')
const curlirize = require('axios-curlirize')
const { utilsHelper } = require("lib-utils")
const { formatErrorService, convertToQueryString } = utilsHelper

curlirize(axios)

const toError = (name, err) => formatErrorService(`memberCallsService-${name}`, err)

const formUrlEncoded = x =>
    Object.keys(x).reduce((p, c) => p + `&${c}=${encodeURIComponent(x[c])}`, '')

const getLsb = async ({ baId }) => {
    try {
        const url = `https://member-calls.unicity.com/api/unishop/v1/common/global/LBS`

        console.time(url)
        const { data } = await axios({
            method: `post`,
            url,
            data: formUrlEncoded({ dist_id: baId }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        console.timeEnd(url)

        return data
    } catch (err) {
        console.error(err)
        throw toError('getLsb', err)
    }
}

const getSeminar = async ({ baId, ushopCountryCode }) => {
    try{
        const queryStrings = convertToQueryString({ country_code: ushopCountryCode })
        const url = `https://member-calls2.unicity.com/unishop-fn-misc/seminar/v2/get/${baId}${queryStrings}`
        
        console.time(url)
        const { data } = await axios({
            method: `get`,
            url,
        })
        console.timeEnd(url)
    
        return data
    }catch(err){
        console.error(err)
        throw toError('getLsb', err)
    }
}

module.exports = {
    getLsb,
    getSeminar,
}