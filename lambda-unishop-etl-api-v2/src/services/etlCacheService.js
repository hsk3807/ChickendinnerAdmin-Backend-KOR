const DbCalls = require('../utils/dbCalls')
const { utilsHelper } = require("lib-utils")
const {
    toCmdInsert,
    toCmdUpdate,
} = require("../utils/sqlGenerator")
const { formatErrorService } = utilsHelper

const toError = (name, err) => formatErrorService(`etlCacheService-${name}`, err)

const toRaw = obj => ({
    ...obj,
    hydraCache: JSON.stringify(obj.hydraCache)
})

const toObj = raw => ({
    ...raw,
    hydraCache: JSON.parse(raw.hydraCache)
})

const createOnselfCache = async ({
    tokenHydra,
    baId,
    ushopCountryCode,
    hydraCache,
}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const insertData = toRaw({
            updatedAt,
            tokenHydra,
            baId,
            ushopCountryCode,
            hydraCache,
        })

        const productExcuteParams = toCmdInsert('etl_onself_cache', insertData)
       
        const insertResult = await dbCalls.excuteQuery(productExcuteParams)
        return insertResult
    }catch(err){
        console.error(err)
        throw toError("createOnselfCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const createOrderHistoryCache = async ({
    tokenHydra,
    baId,
    periodStart, 
    periodEnd,
    ushopCountryCode,
    hydraCache,
}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const insertData = toRaw({
            updatedAt,
            tokenHydra,
            baId,
            periodStart, 
            periodEnd,
            ushopCountryCode,
            hydraCache,
        })

        const productExcuteParams = toCmdInsert('etl_order_history_cache', insertData)
        const insertResult = await dbCalls.excuteQuery(productExcuteParams)

        return insertResult
    }catch(err){
        console.error(err)
        throw toError("createOrderHistoryCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const createGenealogyCache = async ({
    tokenHydra, 
    baId, 
    ushopCountryCode,
    periodStart,
    periodEnd, 
    maxTreeDepth,
    limitItems,
    hydraCache,
}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const insertData = toRaw({
            updatedAt,
            tokenHydra, 
            baId, 
            ushopCountryCode,
            periodStart,
            periodEnd, 
            maxTreeDepth,
            limitItems,
            hydraCache,
        })

        const productExcuteParams = toCmdInsert('etl_genealogy_cache', insertData)
        const insertResult = await dbCalls.excuteQuery(productExcuteParams)

        return insertResult
    }catch(err){
        console.error(err)
        throw toError("createGenealogyCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateOnselfCache = async ({
    id,
    hydraCache,
}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const updateData = toRaw({
            updatedAt,
            hydraCache,
        })

        const productExcuteParams = toCmdUpdate('etl_onself_cache', { id }, updateData)
        const updateResult = await dbCalls.excuteQuery(productExcuteParams)

        return updateResult
    }catch(err){
        console.error(err)
        throw toError("updateOnselfCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateOrderHistoryCache = async ({
    id,
    hydraCache,
}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const updateData = toRaw({
            updatedAt,
            hydraCache,
        })

        const productExcuteParams = toCmdUpdate('etl_order_history_cache', { id }, updateData)
        const updateResult = await dbCalls.excuteQuery(productExcuteParams)

        return updateResult
    }catch(err){
        console.error(err)
        throw toError("updateOrderHistoryCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateGenealogyCache = async ({
    id,
    hydraCache,
}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const updateData = toRaw({
            updatedAt,
            hydraCache,
        })

        const productExcuteParams = toCmdUpdate('etl_genealogy_cache', { id }, updateData)
        const updateResult = await dbCalls.excuteQuery(productExcuteParams)

        return updateResult
    }catch(err){
        console.error(err)
        throw toError("updateGenealogyCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getListOnselfCache = async ({
    whereConditions,
    skip = 0,
    limit = 1000,
}) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const sql = [
            `SELECT * FROM etl_onself_cache`,
            ...(whereConditions ? [`WHERE`] : []),
            (whereConditions ? Object.keys(whereConditions).map(key => `${key}=?`) : []).join(" AND "),
            `LIMIT ${skip}, ${limit}`,
            `;`,
        ].join(" ")

        const values = [
            ...(whereConditions ? Object.keys(whereConditions).map(key => whereConditions[key]) : []) 
        ]

        const list = await dbCalls.excuteQuery({ sql, values })
        return list.map(r => toObj(r))
    }catch(err){
        console.error(err)
        throw toError("getListOnselfCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getListOrderHistoryCache = async ({
    whereConditions,
    skip = 0,
    limit = 1000,
}) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const sql = [
            `SELECT * FROM etl_order_history_cache`,
            ...(whereConditions ? [`WHERE`] : []),
            (whereConditions 
                ? [
                    ...Object.keys(whereConditions).filter(key => whereConditions[key] !== null).map(key => `${key}=?`),
                    ...Object.keys(whereConditions).filter(key => whereConditions[key] === null).map(key => `${key} IS NULL`),
                ]
                : []
            ).join(" AND "),
            `LIMIT ${skip}, ${limit}`,
            `;`,
        ].join(" ")

        const values = [
            ...(whereConditions 
                ? Object.keys(whereConditions).filter(key => whereConditions[key] !== null).map(key => whereConditions[key]) 
                : []
            ) 
        ]

        const list = await dbCalls.excuteQuery({ sql, values })
        return list.map(r => toObj(r))
    }catch(err){
        console.error(err)
        throw toError("getListOrderHistoryCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getListGenealogyCache = async ({
    whereConditions,
    skip = 0,
    limit = 1000,
}) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const sql = [
            `SELECT * FROM etl_genealogy_cache`,
            ...(whereConditions ? [`WHERE`] : []),
            (whereConditions 
                ? [
                    ...Object.keys(whereConditions).filter(key => whereConditions[key] !== null).map(key => `${key}=?`),
                    ...Object.keys(whereConditions).filter(key => whereConditions[key] === null).map(key => `${key} IS NULL`),
                ]
                : []
            ).join(" AND "),
            `LIMIT ${skip}, ${limit}`,
            `;`,
        ].join(" ")

        const values = [
            ...(whereConditions 
                ? Object.keys(whereConditions).filter(key => whereConditions[key] !== null).map(key => whereConditions[key]) 
                : []
            ) 
        ]

        const list = await dbCalls.excuteQuery({ sql, values })
        return list.map(r => toObj(r))
    }catch(err){
        console.error(err)
        throw toError("getListGenealogyCache", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getOnselfCache = async ({
    tokenHydra,
    baId,
    ushopCountryCode,
}) => {
    try{
        const [ firstData ] = await getListOnselfCache({
            whereConditions: {
                tokenHydra,
                baId,
                ushopCountryCode,
            }
        })
        return firstData
    }catch(err){
        console.error(err)
        throw toError("getOnselfCache", err)
    }
}

const getOrderHistoryCache = async ({
    tokenHydra,
    baId,
    periodStart, 
    periodEnd,
    ushopCountryCode,
}) => {
    try{
        const [ firstData ] = await getListOrderHistoryCache({
            whereConditions: {
                tokenHydra,
                baId,
                periodStart, 
                periodEnd,
                ushopCountryCode,
            }
        })
        return firstData
    }catch(err){
        console.error(err)
        throw toError("getOrderHistoryCache", err)
    }
}

const getGenealogyCache = async ({
    tokenHydra, 
    baId, 
    ushopCountryCode,
    periodStart,
    periodEnd, 
    maxTreeDepth,
    limitItems,
}) => {
    try{
        const [ firstData ] = await getListGenealogyCache({
            whereConditions: {
                tokenHydra, 
                baId, 
                ushopCountryCode,
                periodStart,
                periodEnd, 
                maxTreeDepth,
                limitItems,
            }
        })
        return firstData
    }catch(err){
        console.error(err)
        throw toError("getGenealogyCache", err)
    }
}

module.exports = {
    getOnselfCache,
    getOrderHistoryCache,
    getGenealogyCache,
    createOnselfCache,
    createOrderHistoryCache,
    createGenealogyCache,
    updateOnselfCache,
    updateOrderHistoryCache,
    updateGenealogyCache,
}
