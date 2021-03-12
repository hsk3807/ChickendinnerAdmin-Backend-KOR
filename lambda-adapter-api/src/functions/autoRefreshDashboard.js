const { parseBodyJSON } = require('../utils/helpers')
const RequestCacheService = require("../services/requestCacheService")
const UserService = require("../services/userService")
const GetDashboard = require("./getDashboard")

const refreshData = async (hydraToken, e, baId) =>{
    const {queryStringParameters} = e || {}

    const customerData = await UserService.getCustomerTokenByBaId(hydraToken, baId)
    const {token:customerToken} = customerData || {}

    e.queryStringParameters.byPassCache = 1
    e.headers["authorization-hydra"] = `Bearer ${customerToken}`

    return await GetDashboard.handler(e)
}

module.exports.handler = async e => {
    const filters = {
        tag: "= 'Dashboard'",
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