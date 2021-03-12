
const mysql = require('mysql');

module.exports.createConnector = ({ host, user, password, database }) => new Promise((resolve, reject) => {
    const conn = mysql.createConnection({ host, user, password, database, multipleStatements: true });
    conn.connect(error => {
        if (error) reject(error)
        resolve(conn)
    });
})

module.exports.query = (conn, options) => {
    return new Promise((resolve, reject) => {
        conn.query(options, (error, results) => {
            if (error) reject(error)
            resolve(results)
          });
    })
}

module.exports.runTransactions = (conn, transactions = []) => {

}