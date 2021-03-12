const serverlessExpress = require('@vendia/serverless-express');
const app = require('./index');

module.exports.handler = serverlessExpress({ app });
