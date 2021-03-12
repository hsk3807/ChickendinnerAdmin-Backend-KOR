const aws = require('aws-sdk');
const lambda = new aws.Lambda();

const { FUNC_NAME_POPUP_PUBLISH_POPUP } = process.env

const invokeGetPublishMenu = async ({
    countryCode,
    baId,
    token,
    status,
    userCountry
}) => {
    const pathParameters = { countryCode }
    const queryStringParameters = { baId, token, status, userCountry }
    const e = { pathParameters, queryStringParameters }

    const { Payload: invokePayload } = await lambda.invoke({
        FunctionName: FUNC_NAME_POPUP_PUBLISH_POPUP,
        Payload: JSON.stringify(e, null, 2),
    }).promise()

    const invokeResponse = JSON.parse(invokePayload)
    const { statusCode, body: rawBody } = invokeResponse
    const body = JSON.parse(rawBody)

    if (statusCode !== 200) throw body

    return body
}


module.exports = {
    invokeGetPublishMenu
}