const { createLogger, format, transports } = require('winston')
const path = require('path')
const { LOG_LEVEL } = require('../config/app')

const logger = createLogger({
    level: LOG_LEVEL, // { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
    format: format.combine(format.splat(), format.colorize(), format.simple()),
    transports: [new transports.Console()],
})

module.exports = logger
