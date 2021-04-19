'use strict';

const AWS = require('aws-sdk');

module.exports = new AWS.DynamoDB.DocumentClient({region: 'ap-southeast-1'});
