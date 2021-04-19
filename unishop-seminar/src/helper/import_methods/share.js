const _ = require('lodash')
const importHelper = require('./share')


module.exports = function (event, context) {
    const seminarCountryCodeDB = require('../../model/seminar_country_code')(event, context)
    return {
        importCountryCode: importCountryCode
    }
    // ====================================
    async function importCountryCode (countryCodes, template) {
        const rows = unique(countryCodes).map( each => {
            return { country_code: each, template } 
        })
        const MAX_TIMES = Math.ceil(rows.length / 25)
        for (let i = 0; i < MAX_TIMES; i++) {
            console.log(`importCountryCode ${i*25} ${(i+1)*25}`)
            await seminarCountryCodeDB.batchCreate(rows.slice(i*25, (i+1)*25))
        }
    }
    function unique (array) {
        return [...new Set(array)]

    }
}