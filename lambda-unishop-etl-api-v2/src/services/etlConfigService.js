const DbCalls = require('../utils/dbCalls')
const { utilsHelper } = require("lib-utils")
const {
    toCmdUpdate,
    combileExcuteParams,
} = require("../utils/sqlGenerator")

const { formatErrorService } = utilsHelper

const toError = (name, err) => formatErrorService(`etlConfigService-${name}`, err)

const toObj = rawData => Object
    .keys(rawData)
    .reduce((obj, key) => {
        if ([ // bool columns
            "cacheEnable",
            "cacheRefreshEnable",
            "autoFetchEnable",
            "autoFetchIsStoreCache",
            "autoFetchAfterLogin",
        ].includes(key)) {
            obj = { ...obj, [key]: !!rawData[key] }
        } else if ([ // json columns
            "cacheModuleList"
        ].includes(key)) {
            obj = { ...obj, [key]: JSON.parse(rawData[key] || "[]"), }
        } else {
            obj = { ...obj, [key]: rawData[key] }
        }
        return obj
    }, {})

const toRaw = objData => Object
    .keys(objData)
    .reduce((obj, key) => {
        if ([ // bool columns
            "cacheEnable",
            "cacheRefreshEnable",
            "autoFetchEnable",
            "autoFetchIsStoreCache",
            "autoFetchAfterLogin",
        ].includes(key)) {
            obj = { ...obj, [key]: objData[key] ? 1 : 0 }
        } else if ([ // json columns
            "cacheModuleList"
        ].includes(key)) {
            obj = { ...obj, [key]: JSON.stringify(objData[key] || []), }
        } else {
            obj = { ...obj, [key]: objData[key] }
        }
        return obj
    }, {})

const getList = async ({
    whereConditions,
    skip = 0,
    limit = 1000,
}) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const sql = [
            `SELECT * FROM etl_configs`,
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
        throw toError("getList", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getOne = async ({ ushopCountryCode }) => {
    try{
        const [ firstData ] = await getList({
            whereConditions: { ushopCountryCode }
        })
        return firstData
    }catch(err){
        console.error(err)
        throw toError("getOne", err)
    }
}

const editOne = async ({
    editData
}) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()
        
        const rawData = toRaw(editData)
        const { ushopCountryCode, ...updateData } = rawData
        const excuteParams = toCmdUpdate('etl_configs', { ushopCountryCode }, updateData)
        
        return dbCalls.excuteQuery(excuteParams)
    }catch(err){
        console.error(err)
        throw toError("editOne", err)
    }
}

module.exports = {
    getOne,
    editOne,
}