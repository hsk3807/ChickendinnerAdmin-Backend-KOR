
const TABLE = process.env.DYNAMO_DB_MAIN_TABLE;
module.exports = function (event, context) {
    return require('./parent')(event, context, TABLE)
}