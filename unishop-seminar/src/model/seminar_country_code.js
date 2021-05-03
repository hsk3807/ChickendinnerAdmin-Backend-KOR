
const TABLE = process.env.DYNAMO_DB_COUNTRY_CODE_TABLE;
module.exports = function (event, context) {
    return require('./parent')(event, context, TABLE)
}