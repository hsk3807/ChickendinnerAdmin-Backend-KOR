const _ = require('lodash')
const stringify = require('json-stringify-safe')
const axios = require('axios')
const curlirize = require('axios-curlirize')
const { ENABLE_CURLIRIZE_LOG } = require('../config/app')
const logger = require('../helper/log')

curlirize(axios)

module.exports = function (event, context) {
    const Common = require('./common')(event, context)
    const NonHydra = require('./non-hydra')(event, context)

    return {
        responseError: responseError,
        getHydraVersion: getHydraVersion,
        getHydraDomain: getHydraDomain,
        orderCalc: orderCalc,
    }

    // ====================================
    function responseError(code, message, errorCode, errorMessage) {
        const response = {
            error: {
                code: code,
                message: message,
                error_code: errorCode,
                error_message: errorMessage,
            },
        }
        return {
            statusCode: code,
            body: stringify(response),
        }
    }
    function getHydraVersion() {
        return process.env.HYDRA_VERSION
    }
    function getHydraDomain() {
        const customEnv = Common.getQueryStringValue('env')
        return `https://${getSubdomain()}.unicity.net/${getDb()}`

        // ===============================
        function getSubdomain() {
            if (customEnv === 'prod') {
                return 'hydra'
            }
            if (Common.isLocal() || Common.isDev() || customEnv === 'qa') {
                return 'hydraqa'
            }
            return 'hydra'
        }
        function getDb() {
            if (customEnv === 'prod') {
                return process.env.HYDRA_VERSION
            }
            if (Common.isLocal() || Common.isDev() || customEnv === 'qa') {
                return `${process.env.HYDRA_VERSION}-test`
            }
            return process.env.HYDRA_VERSION
        }
    }
    async function orderCalc(postData) {
        const headers = {
            'Content-Type': 'application/json;charset=UTF-8',
        }
        const hydraApi = `${getHydraDomain()}/orderTerms?expand=item`
        // console.log('\norderCalc Post\n', hydraApi+'\n', stringify(postData))
        logger.silly(
            '<<orderCalc Post>>\n' +
                hydraApi +
                '\n' +
                stringify(postData) +
                '\n'
        )

        let curlCommand = ''
        let responseUuid = ''
        let responseDateTime = ''
        let responseData = {}

        let referrerUrl = 'No Referer'
        if (Object.keys(event.headers).includes('Referer'))
            referrerUrl = event.headers.Referer
        if (Object.keys(event.headers).includes('referer'))
            referrerUrl = event.headers.referer

        try {
            const result = await axios({
                method: 'POST',
                url: hydraApi,
                headers: headers,
                data: postData,
                curlirize: ENABLE_CURLIRIZE_LOG,
            })
            curlCommand = result.config.curlCommand
            responseUuid = result.headers['x-request-uuid']
            responseDateTime = result.headers['date']
            responseData = result.data
            logger.silly(
                '<<orderCalc Result>>\n' + stringify(result.data) + '\n'
            )
        } catch (error) {
            logger.error(
                '<<norderCalc Error>>\n' +
                    error.stack +
                    '\n\n' +
                    stringify(error.response.data) +
                    '\n\n'
            )
            curlCommand = error.config.curlCommand
            responseUuid = error.response.headers['x-request-uuid']
            responseDateTime = error.response.headers['date']
            responseData = error.response.data
        } finally {
            try {
                const logResult = await NonHydra.remoteLog(
                    Common.objToLookLikeJsonString({
                        uuid: responseUuid,
                        time: responseDateTime,
                        curl: curlCommand,
                    }),
                    JSON.stringify(responseData),
                    referrerUrl
                )
                if (logResult.data && logResult.data.id)
                    responseData.log_id = logResult.data.id
            } catch (logError) {
                logger.error(
                    '<<logError>>\n' + logError.stack + '\n',
                    stringify(logError.response.data) + '\n\n\n'
                )
                responseData.log_id = null
            }
            return responseData
        }
    }
}
