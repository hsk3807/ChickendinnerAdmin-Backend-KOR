const { parseBodyJSON } = require('../../utils/helpers')
const RequestCacheService = require("../../services/requestCacheService")
const UserService = require("../../services/userService")
const GetOnself = require("./getOnself")
const { tokenGenerator } = require("lib-utils")

const refreshData = async (hydraToken, e, baId) =>{
    const customerData = await UserService.getCustomerTokenByBaId(hydraToken, baId)
    const {token:customerToken} = customerData || {}

    delete e.queryStringParameters.byPassCache
    e.queryStringParameters.baId = baId
    e.queryStringParameters.token = tokenGenerator.create(baId)
    e.queryStringParameters.byPassCache = 1
    
    e.headers["authorization-hydra"] = `Bearer ${customerToken}`
    
    return GetOnself.handler(e)
}

const handler = async (options = {}) => {s
    const filters = options.filters 
        ? options.filters 
        : {
            tag: "= 'etl/Onself'",
            baId: "IS NOT NULL",
            usageCounter : ">= 1",
        }

    const list = await RequestCacheService.getList({ filters });

    if (list.length > 0){
        const user = await UserService.getStaffUser()
        const { token: hydraToken } = user

        const process = list.map(r => {
            const requestData = parseBodyJSON(r.requestData)
            return refreshData(hydraToken, requestData, r.baId)
        })

        const results = await Promise.allSettled(process)
        console.info(results)
    }
}

module.exports = {
    refreshData,
    handler,
}