const { parseBodyJSON } = require('../../utils/helpers')
const RequestCacheService = require("../../services/requestCacheService")
const UserService = require("../../services/userService")
const GetGenealogy = require("./getGenealogy")
const GetOnself = require("./getOnself")
const { tokenGenerator }  = require("lib-utils")

const refreshGenealogy = async (hydraToken, e, baId) =>{
    const customerData = await UserService.getCustomerTokenByBaId(hydraToken, baId)
    const {token:customerToken} = customerData || {}

    delete e.queryStringParameters.byPassCache
    e.queryStringParameters.baId = baId
    e.queryStringParameters.prepareCache = false
    e.queryStringParameters.token = tokenGenerator.create(baId)
    e.queryStringParameters.byPassCache = 1
    
    e.headers["authorization-hydra"] = `Bearer ${customerToken}`
    
    return GetGenealogy.handler(e)
}

const refreshOnself = async (hydraToken, e, baId) =>{
    const customerData = await UserService.getCustomerTokenByBaId(hydraToken, baId)
    const {token:customerToken} = customerData || {}

    delete e.queryStringParameters.byPassCache
    e.queryStringParameters.baId = baId
    e.queryStringParameters.token = tokenGenerator.create(baId)
    e.queryStringParameters.byPassCache = 1
    
    e.headers["authorization-hydra"] = `Bearer ${customerToken}`
    
    return GetOnself.handler(e)
}

const handler = async () => {
    const listOfBaId = await RequestCacheService.getListOfBaId({ 
        filters: {
            tag: `IN ('etl/Genealogy', 'etl/Onself')`,
            usageCounter : ">= 1",
        } 
    });
    
    const refreshList = await RequestCacheService.getList({
        filters: {
            tag: `IN ('etl/Genealogy', 'etl/Onself')`,
            baId: `IN (${listOfBaId.map(baId => `'${baId}'`).join(`,`)})`
        }
    })

    if (refreshList.length > 0){
        const user = await UserService.getStaffUser()
        const { token: hydraToken } = user

        console.info(`== Refresh List`, refreshList.map(({baId, tag})=> ({baId, tag})))

        const req = refreshList.reduce((list, r) => {           
            const requestData = parseBodyJSON(r.requestData)

            if (r.tag === 'etl/Genealogy'){
                list.push(refreshGenealogy(hydraToken, requestData, r.baId))
            }else if (r.tag === 'etl/Onself'){
                list.push(refreshOnself(hydraToken, requestData, r.baId))
            }

            return list
        }, [])

        const res = await Promise.allSettled(req)
    }else{
        console.info("== Nothing to update.")
    }
}

module.exports = { handler }