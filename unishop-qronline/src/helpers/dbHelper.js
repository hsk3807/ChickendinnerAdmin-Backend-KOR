'use strict';

module.exports.getDynamoDBConnection = () => {
    const AWS = require('aws-sdk');
    return new AWS.DynamoDB.DocumentClient({region: 'ap-southeast-1'});
};

module.exports.getMysqlDBConnection = () => {
    const mysql = require('mysql2');
    const config = {
        host: process.env.MYSQL_DB_HOST,
        user: process.env.MYSQL_DB_USER,
        password: process.env.MYSQL_DB_PWD,
        database: process.env.MYSQL_DB_NAME,
        port: process.env.MYSQL_DB_PORT,
    };
    
    const connection = mysql.createConnection(config);
    connection.on('error', (err) => {
        return null;
    });
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
    
    
};

module.exports.getTableName = (stage, tableName) => {

    let suffix = '-' + stage;
    if (stage === 'prod') {
        suffix = '';
    }
    if (stage === 'prod' && tableName === 'payments-scb-confirms') {
        suffix = '-uat';
    }
    if (stage === 'local') {
        suffix = '-dev';
    }

    return tableName + suffix;
};