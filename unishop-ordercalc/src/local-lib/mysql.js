module.exports = async function(config) {
    const mysql = require('mysql2');
    const params = {
        host: config.host,
        user: config.user,
        password: config.pwd,
        database: config.name,
        port: config.port,
    };

    const connection = await getConnection(params)
    return (function() {
        return {
            exec: (sql, params=[]) => {
                return new Promise((resolve, reject) => {
                    connection.query(sql, params, (err, results) => {
                        if (err) reject( err)
                        resolve(results)
                    } )
                })
            },
            disconnect: () => {
                connection.end();
            }
        }
    }) ()

    function getConnection (dbConfig) {
        return new Promise(( resolve, reject ) => {
            const connection = mysql.createConnection(params);
            connection.connect(function (err) {
                if (err) reject(new Error('cannot_connect_mysql_db'))
                resolve(connection)
            })
        })
    }
};
