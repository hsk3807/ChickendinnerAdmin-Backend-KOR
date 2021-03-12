const { utilsHelper } = require("lib-utils")

const { createHashHref } = require("../utils/etlHelper")
const HydraService = require("./hydraService")
const MemberCallsService = require("./memberCallsService")

const { formatErrorService } = utilsHelper

const toError = (name, err) => formatErrorService(`etlService-${name}`, err)

const getStatisDateCreated = () => {
    let begin = new Date()
    begin.setMonth(begin.getMonth() - 13)
    let end = new Date()

    begin = begin.toISOString().substring(0, 7)
    end = end.toISOString().substring(0, 7)

    return `[${begin};${end}]`
}

const getOnself  = async ({
    tokenHydra,
    baId,
}) => {
    try{
        const customerHref = createHashHref(baId, 'customer')

        // Requests commission, lsb, profile
        const reqCommission = HydraService.getCommission({ tokenHydra, customerHref })
        const reqLsb = MemberCallsService.getLsb({ baId })
        const reqProfile = HydraService.getCustomerProfile({ tokenHydra, customerHref })

        const results = await Promise.allSettled([reqCommission, reqLsb, reqProfile])
    
        const errorResults = results.filter(({ status }) => status === 'rejected').map(({ reason }) => reason)
        if (errorResults.length > 0) throw errorResults

        const [commission, lsb, profile] = results.map(({ value }) => value)
        return { profile, lsb, commission }
    }catch(err){    
        console.error(err)
        throw toError( "getOnself",err )
    }
}

const getOrdersHistory = async ({
    tokenHydra, 
    baId, 
    periodStart, 
    periodEnd,
    ushopCountryCode,
}) => {
    try{
        const customerHref = createHashHref(baId, 'customer')
        const dateCreated = (periodStart && periodEnd) ? `[${periodStart};${periodEnd}]` : getStatisDateCreated()

        const isOrdersUsage = ["KOR"].includes(ushopCountryCode)

        const results = isOrdersUsage 
            ? await HydraService.getOrders({ 
                tokenHydra, 
                customerHref,
                ...(dateCreated ? { dateCreated } : {}),
            })
            : await HydraService.getOrdersAndRmas({ 
                tokenHydra, 
                customerHref,
                ...(dateCreated ? { dateCreated } : {}),
            })

        const ordersHistory = isOrdersUsage 
            ? { orders: results, rmas: { items: [] } }
            : results
    
        return ordersHistory
    }catch(err){
        console.error(err)
        throw toError( "getOrdersHistory", err )
    }
}

const getGenealogy = async ({
    tokenHydra, 
    baId, 
    ushopCountryCode,
    periodStart: periodStartInput, 
    periodEnd: periodEndInput, 
    maxTreeDepth, 
    limit, 
}) => {
    try{
        const customerHref = createHashHref(baId, 'customer')

        // Request Genealogy
        const reqGenealogy = HydraService.getSponsoredCustomersTreePreOrder({ 
            tokenHydra, 
            customerHref, 
            maxTreeDepth, 
            limit 
        })

        // Request AchievementsHistory
        const hasPeriodInputs = periodStartInput && periodEndInput
        const now = new Date()
        const periodStart = hasPeriodInputs ? new Date(periodStartInput) :  new Date(now.getFullYear(), now.getMonth() -5)
        const periodEnd = hasPeriodInputs ? new Date(periodEndInput) : new Date(now.getFullYear(), now.getMonth())
        const reqAchievementsHistory = HydraService.getAchievementsHistoryBetweenPeriods({
            tokenHydra,
            customerHref,
            periodStart, 
            periodEnd,
        })

        // Request OrdersHistory
        const reqOrdersHistory = getOrdersHistory({ 
            tokenHydra, 
            baId, 
            ...(hasPeriodInputs ? {
                periodStart: `${periodStart.getFullYear()}-${("0" + (periodStart.getMonth() + 1)).slice(-2)}`, 
                periodEnd: `${periodEnd.getFullYear()}-${("0" + (periodEnd.getMonth() + 1)).slice(-2)}`, 
            } : {}),
            ushopCountryCode, 
        })

        // Request Seminar
        const reqSeminar = MemberCallsService.getSeminar({
            baId,
            ushopCountryCode,
        })

        // Receive Responses
        const results = await Promise.allSettled([reqGenealogy, reqAchievementsHistory, reqOrdersHistory, reqSeminar])
        const errorResults = results.filter(({ status }) => status === 'rejected').map(({ reason }) => reason)
        if (errorResults.length > 0) throw errorResults

        const [genealogy, achievementsHistory, ordersHistory, seminar] = results.map(({ value }) => value)

        // Genealogy: Add Customer Profile into first item if empty array
        if (genealogy.items.length < 1){
            const customer = await HydraService.getCustomerProfile({ tokenHydra, customerHref })
            genealogy.items = [{ customer, treeDepth: 0 }]
        }

        return { genealogy, achievementsHistory, ordersHistory, seminar}
    }catch(err){
        console.error(err)
        throw toError( "getGenealogy", err )
    }
}

module.exports = {
    getOnself,
    getOrdersHistory,
    getGenealogy,
}