
const stringify = require('json-stringify-safe')
const Sequelize = require('sequelize')

module.exports.createRoute = (path) => {
    if (process.env.STAGE !== 'local') {
        return `/${process.env.BASEPATH}${path}`
    }
    return path    
}
module.exports.responseSuccess = (data) => {
    console.log('responseSuccess', stringify(data))
    return {
        success: true,
        data: data
    }
}
module.exports.responseError = (msgs, code = 400) => {
    console.log('responseError', msgs)
    return {
        error_messages: msgs,
        code: code
    }
}
module.exports.base64_decode = (str) => {
    return Buffer.from(str, 'base64').toString('binary');
}
module.exports.addLogId = (req, res, next) => {
    const logId = req.apiGateway.context.awsRequestId
    res.setHeader('request-log-id', logId)
    next()
}
module.exports.fileNotFoundHandler = (req, res, next) => {
    res.status(404).json(this.responseError(['file_not_found'], 404))
}
module.exports.errorHandler = (err, req, res, next) => {
    console.log(err.stack)
    if (res.statusCode === 200) {
        res.status(500).json(this.responseError(['internal_server_error'], 500))
    } else {
        res.json(this.responseError([err.message], res.statusCode))
    }
}
module.exports.getConnection = () => {
    return new Sequelize(
        process.env.MYSQL_DB_NAME,
        process.env.MYSQL_DB_USER,
        process.env.MYSQL_DB_PWD,
        {
            host: process.env.MYSQL_DB_HOST,
            port: process.env.MYSQL_DB_PORT,
            dialect: 'mysql',
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            }            
        }
    )
}
