'use strict';

const responseHelper = require('../helpers/responseHelper');
const dbHelper = require('../helpers/dbHelper');

module.exports.main = async (event, context, callback)  => {  

    let db = null;
    try {
        console.log('=== generate log ===');
        db = dbHelper.getMysqlDBConnection();
        console.log(await db.exec('show tables'));
        return responseHelper.createSuccess({
            event:event,
            context:context,
            db: process.env.STAGE + ':' + process.env.MYSQL_DB_USER + ':' + process.env.MYSQL_DB_NAME + ':true'
        });
    } catch (e) {
        console.log('TRY CATCH ERROR',e);
        return responseHelper.createFail([e.message]);
    } finally {
        if (db !== null) {
            db.disconnect();
        }
    }
};