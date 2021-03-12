const callConfigs = require('./callConfigs')
const mysqlHelpers = require('./mysqlHelpers')

module.exports = class DbCalls {
    constructor() {
        const {
            DB_HOST,
            DB_USER,
            DB_PASSWORD,
            DB_DBNAME,
        } = process.env

        this.config = {
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: 'calls-test-warehouse',
        }
        this.conn
    }

    async connect() {
        this.conn = await mysqlHelpers.createConnector(this.config)
    }

    async excuteQuery(options) {
        return await mysqlHelpers.query(this.conn, options)
    }

    disconnect() {
        return new Promise((resolve, reject) => {
            if (this.conn) {
                this.conn.end(err => {
                    if (err) {
                        console.error(err)
                        reject(err)
                    }
                    resolve()
                })
            } else {
                resolve()
            }
        })
    }
}
