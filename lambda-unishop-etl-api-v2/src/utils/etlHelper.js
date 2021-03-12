const deepEqual = require('fast-deep-equal')
const crypto = require("crypto")
const { mappingStatusList } = require("lib-global-configs")
const { utilsHelper } = require("lib-utils")
const { formatErrorHelper } = utilsHelper

const toError = (name, err) => formatErrorHelper(`etlHelper-${name}`, err)

const createHashHref = (id, hrefType) => {
    const text = hrefType === 'customer'? 'unicity': hrefType === 'order'? 'infotrax': ''
    if (text === '') return ''
    const iv = new Buffer.alloc(16);
    const key = "d8578edf8458ce06fbc5bb76a58c5ca4";
    const cypher = crypto.createCipheriv("aes-256-cbc", key, iv);
    cypher.setAutoPadding(false);
    let input = Buffer.from(`?${text}=${id}`, "ascii");
    let len = Math.ceil(input.length / 16) * 16;
    let max = Buffer.alloc(len, 0);
    let dec = cypher.update(Buffer.concat([input, max], len));
    dec = Buffer.concat([dec, cypher.final()]);
    return dec.toString("hex");    
}

const toEtlOnself = onselfHydra => {
    try{
        const { profile } = onselfHydra
        const { mobilePhone, workPhone, homePhone } = profile
        return {
            ...onselfHydra,
            profile : {
                ...profile,
                etlPhone: mobilePhone || workPhone || homePhone || null,
            },
        }
    }catch(err){
        console.error(err)
        throw toError('toEtlOnself', err)
    }   
}

const distinctOrdersHistoryItem = (list, r) => {
    try{
        const { currency, ...compare } = r
        const foundItem = list.find(({ currency, ...it }) => deepEqual(it, compare))
        return foundItem ? list : [...list, r]
    }catch(err){
        console.error(err)
        throw toError('distinctOrdersHistoryItem', err)
    }
}

const toOrdersHistoryItem = item => {
    try{
        const mapFulfillmentStatus = {
            "Fulfilled": 4,
            "UnFulfilled": 2,
        }
        const ushopStatus = mapFulfillmentStatus[item.fulfillmentStatus] 
            ? mapFulfillmentStatus[item.fulfillmentStatus]
            : 1 
    
        return {
            ...item,
            ushopStatus,
        }
    }catch(err){
        console.err(err)
        throw formatErrorHelper('toOrdersHistoryItem', err)
    } 
}

const toEtlOrdersHistory = hydra => {
    try{
        const ordersItems = hydra.orders.items
            .reduce(distinctOrdersHistoryItem, [])
            .map(toOrdersHistoryItem)

        const rmasItems = hydra.rmas.items
            .reduce(distinctOrdersHistoryItem, [])
            .map(toOrdersHistoryItem)

        const allItems = [ ...ordersItems, ...rmasItems ]
        const ordersSortedItems = allItems
            .reduce((list, r) => 
                list.findIndex(v => v.period === r.terms.period) > -1 
                    ? list 
                    : [...list, { period: r.terms.period, items: [] }]
            ,[])
            .sort((r1,r2) => r1.period > r2.period ? -1 : r1.period < r2.period ? 1 : 0)
            .map(r => {
                const items = allItems
                    .filter(v => v.terms.period === r.period)
                    .map(v => ({
                        ...v,
                        order: v.id.unicity,
                        ushopStatus: v.ushopStatus,
                        terms: {
                            ...v.terms,
                            ushopCurrencyCode: v.currency,
                        },
                    }))
                    .sort((v1, v2) => v1.dateCreated > v2.dateCreated ? -1 : v1.dateCreated < v2.dateCreated ? 1 : 0)

                return { ...r, items }
            })

        const ordersHistory = {
            orders: { items: ordersItems },
            rmas: { items: rmasItems },
            orders_sorted : ordersSortedItems,
        }

        return ordersHistory
    }catch(err){
        console.error(err)
        throw toError('toEtlOrdersHistory', err)
    }
}

const getCustomerUshopDistStatus = customer => {
    try{
        const { status, type } = customer || {}
        const foundItem = mappingStatusList.find(r => r.status === status && r.type === type)
        const { code: ushopDistStatus } = foundItem || {}
        return ushopDistStatus
    }catch(err){
        console.error(err)
        throw toError('getCustomerUshopDistStatus', err)
    }    
}    

const toEtlGenealogyItem = item => {
    try{
        const { customer, treeDepth } = item    
        const { mobilePhone, workPhone, homePhone } = customer
    
        const etlPhone = mobilePhone || workPhone || homePhone || null
        const ushopDistStatus = getCustomerUshopDistStatus(customer) 
    
        return {
            ushopDistStatus,
            customer: {
                ...customer,
                etlPhone,
            },
            treeDepth,
        }
    }catch(err){
        console.error(err)
        throw toError('toEtlGenealogyItem', err)
    }
}

const toEtlAchievementsHistoryItem = r => {
    try{
        const { value = [] } = r || {};
        const defaultRank = value.reduce((lastRank, v) => {
            const {
                metrics,
                achievement = {},
            } = v || {}
            const { rankShort } = achievement
    
            const filterMetrics = Array.isArray(metrics)
                ? metrics.filter(({ name }) => [
                    "ov_apt1",
                    "ov_leg1",
                    "ov_leg2",
                    "ov_leg3hc_pv_excluded"
                ].includes(name))
                : []
    
            const isQualified = Array.isArray(metrics)
                ? filterMetrics.length > 0
                    ? filterMetrics.findIndex(({ qualified }) => qualified === false) < 0
                    : true
                : false
    
            let rankShortLast = lastRank
            if (typeof lastRank === "object") {
                const { achievement: achievementLastRank } = lastRank || {}
                const { rankShort: lastRankShort } = achievementLastRank || {}
                rankShortLast = lastRankShort
            }
            return isQualified ? rankShort : rankShortLast
        })
    
        return { ...r, defaultRank: defaultRank ? defaultRank : "Mgr" }
    }catch(err){
        console.error(err)
        throw toError('toEtlAchievementsHistoryItem', err)
    }   
}

const getPrevMonthOv = genealogyItem => {
    const { customer = {} } = genealogyItem || {}
    const { metricsProfileHistory = {} } = customer
    const { items = [] } = metricsProfileHistory
    const [_, prevMonth = {}] = items
    return prevMonth ? prevMonth.value.ov : 0
}

const toEtlGenealogy = hydra => {
    try{
        const {
            genealogy,
            achievementsHistory,
            ordersHistory: ordersHistoryHydra,
            seminar,
        } = hydra
    
        // ETL: Genealogy
        const [ uplineItem ] = genealogy.items
        const genealogyItems = genealogy.items.map(toEtlGenealogyItem)
        const genealogySortOVItems = genealogy.items
            .filter(r => r.customer.unicity !== uplineItem.customer.unicity)
            .sort((r1, r2) => {
                const ovR1 = getPrevMonthOv(r1)
                const ovR2 = getPrevMonthOv(r2)
                return ovR1 > ovR2 ? -1 : ovR1 < ovR2 ? 1 : 0
            })
            .reduce((list, r) => [...list, r], [uplineItem])
            .map(toEtlGenealogyItem)
        const genealogyHideZeroItems = genealogy.items
            .filter(r => r.customer.unicity !== uplineItem.customer.unicity)
            .filter(r => getPrevMonthOv(r) > 0)
            .reduce((list, r) => [...list, r], [uplineItem])
            .map(toEtlGenealogyItem)
        const genealogySortOVwithHideZeroItems = genealogy.items
            .filter(r => r.customer.unicity !== uplineItem.customer.unicity)
            .filter(r => getPrevMonthOv(r) > 0)
            .sort((r1, r2) => {
                const ovR1 = getPrevMonthOv(r1)
                const ovR2 = getPrevMonthOv(r2)
                return ovR1 > ovR2 ? -1 : ovR1 < ovR2 ? 1 : 0
            })
            .reduce((list, r) => [...list, r], [uplineItem])
            .map(toEtlGenealogyItem)
            
        // ETL: AchievementsHistory
        const achievementsHistoryItems = achievementsHistory.items
            .sort((r1, r2) => r1.period > r2.period ? -1 : r1.period < r2.period ? 1 : 0)
            .reduce((list, r) => {
                const foundItem = list.find(it => it.period === r.period)
                return foundItem ? list : [...list, r]
            }, [])
            .map(toEtlAchievementsHistoryItem)

        // ETL: OrdersHistory
        const ordersHistory = toEtlOrdersHistory(ordersHistoryHydra)
    
        return {
            genealogy: { 
                items: genealogyItems,
                itemsSortOV: genealogySortOVItems,
                itemsHideZero: genealogyHideZeroItems,
                itemsSortOVwithHideZero: genealogySortOVwithHideZeroItems,
            },
            achievementsHistory: { 
                items: achievementsHistoryItems 
            },
            ordersHistory,
            seminar,
        }
    }catch(err){
        console.error(err)
        throw toError("toEtlGenealogy", err)
    }   
}

module.exports = {
    createHashHref,
    toEtlOnself,
    toEtlOrdersHistory,
    toEtlGenealogy,
}