'use strict';

const AWS = require('aws-sdk');


class DbConnector {
  constructor(options = {}) {
    this.documentClient = new AWS.DynamoDB.DocumentClient(options)
  }

  insert(TableName, partition, key, data) {
    const Item = { partition, key, ...data }
    return this.documentClient.put(
      {
        TableName,
        Item,
        ConditionExpression: `attribute_not_exists(${key})`
      }).promise()
  }

  replace(TableName, partition, key, data) {
    const Item = { partition, key, ...data }
    return this.documentClient.put(
      {
        TableName,
        Item
      }).promise()
  }

  get(TableName, partition, key) {
    return this.documentClient.get(
      {
        TableName,
        Key: { partition, key }
      }).promise()
  }

  getList(TableName, partition, key) {
    return this.documentClient.scan({
      TableName,
        Key: { partition, key }
    }).promise()
  }

  update(TableName, partition, key, { expression, names, values }) {
    return this.documentClient.update({
      TableName,
      Key: { partition, key },
      UpdateExpression: expression,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values
    }).promise()
  }



}


module.exports = new DbConnector()