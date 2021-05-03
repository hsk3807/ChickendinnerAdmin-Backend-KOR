var development = require('./env_development')
var production = require('./env_production')

var envConfig = undefined
if (process.env.ENV == 'production') {
    envConfig = production
} else {
    envConfig = development
}

module.exports = envConfig // export default 는 안먹힘
