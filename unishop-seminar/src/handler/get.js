'use strict';

const _ = require('lodash')
const stringify = require('json-stringify-safe')
const awsHelper = require('../helper/aws')

module.exports.main = async (event, context, callback) => {
    const CommonHelper = require('../helper/common')(event, context)
    const seminarDB = require('../model/seminar')(event, context)
    const seminarCountryCodeDB = require('../model/seminar_country_code')(event, context)
    console.log('======================== get ========================')
    try {
        if (!CommonHelper.isValidToken()) {
            return CommonHelper.responseErrorMessages(['Unauthorized'], 401)
        }
        const baId = CommonHelper.getPathParameter('baId')
        const result = await seminarDB.get('ba_id', baId)
        console.log('result', stringify(result))

        if (!_.isEmpty(result) && result.Item.template) {
            try {
                const worker = require(`../helper/import_methods/${result.Item.template}`)(event, context)
                worker.updateData(result.Item)
            } catch (e) {
                console.log(`${result.Item.template} not found.`, e.stack)
            }
        }
        const response = {
            success: true,
            data: _.isEmpty(result)? null: {...result.Item},
            template: null          
        }
        const countryCode = CommonHelper.getQueryStringValue('country_code')
        if (!_.isEmpty(countryCode)) {
            const result = await seminarCountryCodeDB.get('country_code', countryCode.toUpperCase())
            if (!_.isEmpty(result)) {
                response.template = result.Item.template
                try {
                    const worker = require(`../helper/import_methods/${result.Item.template}`)(event, context)
                    worker.updateData(response)
                } catch (e) {
                    console.log(`${result.Item.template} not found.`, e.stack)
                }                
            }
        }
        return CommonHelper.responseSuccess(response)
    } catch (error) {
        console.log(error.stack)
        return CommonHelper.responseErrorMessages([error.message], 500)
    }
}   