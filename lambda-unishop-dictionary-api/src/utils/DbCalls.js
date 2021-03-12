const callConfigs = require('./callConfigs')
const mysqlHelpers = require('./mysqlHelpers')

module.exports = class DbCalls {
    constructor() {
        this.config = callConfigs.getConfigDbCalls()
        this.conn
    }

    async connect() {
        this.conn = await mysqlHelpers.createConnector(this.config)
    }

    async excuteQuery(options) {
        return await mysqlHelpers.query(this.conn, options)
    }

    async excuteBulkQuery(options){
        return await mysqlHelpers.bulkQuery(this.conn, options)
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
