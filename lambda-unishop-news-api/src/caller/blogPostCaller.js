const aws = require('aws-sdk');
const lambda = new aws.Lambda();

const {
    FUNC_NAME_BLOGPOST_GET
} = process.env

const getById = async id => {
    const e = { pathParameters: { id } }
    const result = await lambda.invoke({
        FunctionName: FUNC_NAME_BLOGPOST_GET,
        Payload: JSON.stringify(e, null, 2),
    }).promise() || {}

    if (result.StatusCode !== 200) throw result

    const { Payload } = result
    const { statusCode, body }  = JSON.parse(Payload || "{}")

    return statusCode === 200 
        ? JSON.parse(body) 
        : null
}

module.exports = {
    getById
}