const mysqlConnector = require('./mysqlConnector')

const {
    DB_CALLS_HOST,
    DB_CALLS_DBNAME,
    DB_CALLS_USER,
    DB_CALLS_PASSWORD,
} = process.env

module.exports = class DbCalls {
    constructor() {
        this.config = {
            host : DB_CALLS_HOST, 
            database : DB_CALLS_DBNAME,
            user : DB_CALLS_USER, 
            password : DB_CALLS_PASSWORD, 
        }
        this.conn
    }

    async connect() {
        this.conn = await mysqlConnector.createConnector(this.config)
    }

    async excuteQuery(options) {
        return await mysqlConnector.query(this.conn, options)
    }

    disconnect() {
        return new Promise((resolve, reject) => {
            if (this.conn){
                this.conn.end(err=>{
                    if (err) {
                        console.error(err)
                        reject(err)
                    }
                    resolve()
                })
            }else{
                resolve()
            }
        })
    }
}
