module.exports.getConfigDbCalls = () =>{
    const {
        DB_HOST,
        DB_USER,
        DB_PASSWORD,
        DB_DBNAME,
    } = process.env
    return {
        host : DB_HOST, 
        user : DB_USER, 
        password : DB_PASSWORD, 
        database : DB_DBNAME,
   }
}