const jwt = require('jsonwebtoken')
const secret = require('../utils/secret')

const generatePolicy = function (principalId, effect, resource) {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};

module.exports.handler = (e, _, callback) => {
    try {
        const token = e.authorizationToken
        jwt.verify(token, secret, err => {
            if (err) {
                console.error(err)
                callback("Unauthorized")
            }
            callback(null, generatePolicy('user', 'Allow', e.methodArn))         
        })
    } catch (err) {
        console.error(err)
        callback("Unauthorized")
    }
};