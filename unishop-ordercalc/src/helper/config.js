const AWSHelper = require('../local-lib/aws')

module.exports = function (event, context) {
    const Common = require('../local-lib/common')(event, context)
    const DB_CONFIG_KEY = '/unishop/config/db'

    return {
        getDB: getDB
    }
    // ============================
    async function getDB () {
        try {
            const result = await AWSHelper.ssmGet(DB_CONFIG_KEY)
            const dbConfigs =  JSON.parse(result.Parameter.Value)
            const found = dbConfigs.find(each => each.env === Common.getStage())
            if (!found) throw new Error('cannot_get_config')
            return found
        } catch (e) {
            throw e
        }
    }
}