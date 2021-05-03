'use strict';

const dbHelper = require('../helpers/dbHelper');
const responseHelper = require('../helpers/responseHelper');
const commonHelper = require('../helpers/commonHelper');
const scbModel = require('../model/scb');

module.exports.main = async (event, context, callback) =>
{
  try {
    const stage = commonHelper.getStage();
    console.log('stage', stage);
    const db = dbHelper.getDynamoDBConnection();
    await scbModel.create(stage, db, event.body);
    return responseHelper.createSuccess(event.body);
  } catch (e) {
    console.log(e.stack);
    return responseHelper.createFail([e.message]);
  }  
  // return callback(null, responseHelper.getSuccess({success: true}));
};
