const aws = require('aws-sdk')
const lambda = new aws.Lambda()
const { utilsHelper } = require("lib-utils")
const { formatErrorService } = utilsHelper


const { FUNC_NAME_GET_PUBLISH_POPUP } = process.env

const toError = (name, err) => formatErrorService(`menuService-${name}`, err)

const invokeGetPublishPopUp = async ({
    countryCode,
    baId,
    token,
    status,
    userCountry,
    InvocationType = "RequestResponse", // [RequestResponse, Event, DryRun]
}) => {
    try{
        const payload = {
            pathParameters: { countryCode },
            queryStringParameters: { baId, token, status, userCountry },
        }
    
        const { 
            StatusCode,
            Payload,
         } = await lambda.invoke({
            FunctionName: FUNC_NAME_GET_PUBLISH_POPUP,
            InvocationType,
            Payload: JSON.stringify(payload),
        }).promise()
    
        const payloadObj = JSON.parse(Payload || null)
    
        if (StatusCode === 200){
            const { body } = payloadObj
            return JSON.parse(body)   
        }else{
            throw payloadObj   
        }
    }catch(err){
        console.error(err)
        throw toError('invokeGetByOne', err)
    } 
}


module.exports = {
    invokeGetPublishPopUp
}