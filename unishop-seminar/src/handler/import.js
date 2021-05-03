'use strict';

const _ = require('lodash')
const awsHelper = require('../helper/aws')

module.exports.main = async (event, context, callback) => {
    const CommonHelper = require('../helper/common')(event, context)
    console.log('======================== import ========================')
    try {
        if (!CommonHelper.isValidToken()) {
            return CommonHelper.responseErrorMessages(['Unauthorized'], 401)
        }
        const errors = await checkParams()
        if (!_.isEmpty(errors)) return CommonHelper.responseErrorMessages(errors)

        const fileName = CommonHelper.getQueryStringValue('file')
        const cb = CommonHelper.getQueryStringValue('cb')

        const data = await awsHelper.readExcel(fileName)
        if (_.isEmpty(data)) return CommonHelper.responseErrorMessages(['data_not_found'])
        const importHandler = require(`../helper/import_methods/${cb}`)(event, context)
        const result = await importHandler.exec(data)

        return CommonHelper.responseSuccess({ success: true, ...result })        
    } catch (error) {
        console.log(error.stack)
        return CommonHelper.responseErrorMessages([error.message], 500)
    }
    async function checkParams () {
        const errors = []
        const fileName = CommonHelper.getQueryStringValue('file')
        const cb = CommonHelper.getQueryStringValue('cb')
        if (_.isEmpty(fileName)) {
            errors.push('empty_file')
        }
        if (!await awsHelper.fileExists(fileName)) {
            errors.push('file_not_found')
        }        
        if (_.isEmpty(cb)) {
            errors.push('empty_cb')
        }
        try {
            if (!_.isEmpty(cb)) {
                require(`../helper/import_methods/${cb}`)(event, context)
            }
        } catch (error) {
            console.log(error.stack)
            if (error.message.indexOf('Cannot find module')!== -1) {
                errors.push('cb_not_found')
            } else {
                errors.push('internal_server_error')
            }   
        }
        return errors
    }
}