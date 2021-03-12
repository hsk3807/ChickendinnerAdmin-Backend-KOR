const aws = require('aws-sdk')
const lambda = new aws.Lambda()
const { utilsHelper } = require("lib-utils")
const { formatErrorService } = utilsHelper

const { FUNC_NAME_SETTINGS_GET_ONE } = process.env

const toError = (name, err) => formatErrorService(`settingsService-${name}`, err)

const invokeGetByOne = async ({
    countryCode,
    InvocationType = "RequestResponse", // [RequestResponse, Event, DryRun]
}) => {
    try{
        const payload = {
            pathParameters : { countryCode }
        }
    
        const { 
            StatusCode,
            Payload,
        } = await lambda.invoke({
            FunctionName: FUNC_NAME_SETTINGS_GET_ONE,
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
    invokeGetByOne,
}