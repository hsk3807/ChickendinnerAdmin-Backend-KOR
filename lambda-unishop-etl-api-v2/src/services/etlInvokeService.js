
const { utilsHelper } = require("lib-utils")
const aws = require('aws-sdk')

const { formatErrorService } = utilsHelper
const lambda = new aws.Lambda()

const {
    FUNC_NAME_ETL_V2_GET_GENEALOGY,
    FUNC_NAME_ETL_V2_FETCH_GENEALOGY,
} = process.env

const toError = (name, err) => formatErrorService(`etlInvokeService-${name}`, err)

const invokeGetGenealogy = async ({
        tokenHydra,
        baId: baIdInput,
        token: tokenInput,
        ushopCountryCode: ushopCountryCodeInput,
        collapse: collapseInput,
        byPassCache: byPassCacheInput,
        maxTreeDepth: maxTreeDepthInput,
        limit: limitInput,
        periodStart: periodStartInput,
        periodEnd: periodEndInput,
        isAutoFetchTopOv: isAutoFetchTopOvInput,
        InvocationType = 'Event', // Event | RequestResponse | DryRun
}) => {
    try{
        const inputParams = {
            baId: baIdInput,
            token: tokenInput,
            ushopCountryCode: ushopCountryCodeInput,
            collapse: collapseInput,
            byPassCache: byPassCacheInput,
            maxTreeDepth: maxTreeDepthInput,
            limit: limitInput,
            periodStart: periodStartInput,
            periodEnd: periodEndInput,
            isAutoFetchTopOv: isAutoFetchTopOvInput,
        }

        const queryStringParameters = Object.keys(inputParams)
            .filter(key => inputParams[key] !== null)
            .filter(key => inputParams[key] !== undefined)
            .reduce((obj, key) => ({ ...obj, [key]: inputParams[key] }), {})

        const payloadObj = {
            headers: { "authorization-hydra": tokenHydra },
            queryStringParameters,
        }

        const result = await lambda.invoke({
            FunctionName: FUNC_NAME_ETL_V2_GET_GENEALOGY,
            Payload: JSON.stringify(payloadObj, null, 2),
            InvocationType,
        }).promise()

        return result
    }catch(err){
        console.error(err)
        throw toError("invokeGetGenealogy", err)
    }
}

const invokeFetchGenealogy = async ({
    tokenHydra, 
    baId, 
    ushopCountryCode,
    periodStart, 
    periodEnd, 
    maxTreeDepth, 
    limit, 
    InvocationType = 'Event', // Event | RequestResponse | DryRun
}) => {
    try{
        const payloadObj = {
            tokenHydra, 
            baId, 
            ushopCountryCode,
            periodStart, 
            periodEnd, 
            maxTreeDepth, 
            limit, 
        }

        const result = await lambda.invoke({
            FunctionName: FUNC_NAME_ETL_V2_FETCH_GENEALOGY,
            Payload: JSON.stringify(payloadObj, null, 2),
            InvocationType,
        }).promise()

        return result
    }catch(err){
        console.error(err)
        throw toError("invokeFetchGenealogy", err)
    }
}

module.exports = {
    invokeGetGenealogy,
    invokeFetchGenealogy,
}