const aws = require('aws-sdk')
const lambda = new aws.Lambda()

const {
    FUNC_NAME_SETTINGS_GET_BY_COUNTRY,
} = process.env

const invokeGetByCountry = async ({
    countryCode,
    InvocationType = "RequestResponse",
}) => {
    const payload = {
        pathParameters : {
            countryCode,
        }
    }

    const { 
        StatusCode,
        Payload,
    } = await lambda.invoke({
        FunctionName: FUNC_NAME_SETTINGS_GET_BY_COUNTRY,
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
}

module.exports = {
    invokeGetByCountry,
}