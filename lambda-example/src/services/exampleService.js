
const { utilsHelper } = require("lib-utils")
const DbCalls = require('../utils/dbCalls')
const {
    toCmdInsert,
    toCmdUpdate,
    toCmdDelete,
} = require("../utils/sqlGenerator")

const { formatErrorService } = utilsHelper
const toError = (name, err) => formatErrorService(`exampleService-${name}`, err)

const createOne = async ({ data }) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const productExcuteParams = toCmdInsert('db_example', data)
        const insertResult = await dbCalls.excuteQuery(productExcuteParams)

        return insertResult
    }catch(err){
        console.error(err)
        throw toError( "createOne",err )
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getList = async ({
    whereConditions,
    skip = 0,
    limit = 100,
}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const sql = [
            `SELECT * FROM db_example`,
            ...(whereConditions ? [`WHERE`] : []),
            ...(whereConditions ? Object.keys(whereConditions).map(key => `${key}=?`) : []),
            `LIMIT ${skip}, ${limit}`,
            `;`,
        ].join(" ")

        const values = [
            ...(whereConditions ? Object.keys(whereConditions).map(key => whereConditions[key]) : []) 
        ]

        return await dbCalls.excuteQuery({ sql, values })
    }catch(err){
        console.error(err)
        throw toError("getList", err)
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getOne = async ({ id }) => {
    const dbCalls = new DbCalls()
    try{
        const [ firstData ] = await getList({
            whereConditions: { id }
        })
        return firstData
    }catch(err){
        console.error(err)
        throw toError( "createOne",err )
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateOne = async ({ data }) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const {id, ...updateData} = data
        const productExcuteParams = toCmdUpdate('db_example', { id }, updateData)
        const insertResult = await dbCalls.excuteQuery(productExcuteParams)

        return insertResult
    }catch(err){
        console.error(err)
        throw toError( "updateOne",err )
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const deleteOne = async ({id}) => {
    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        const productExcuteParams = toCmdDelete('db_example', { id })
        const deleteResult = await dbCalls.excuteQuery(productExcuteParams)

        return deleteResult
    }catch(err){
        console.error(err)
        throw toError( "updateOne",err )
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    createOne,
    updateOne,
    deleteOne,
    getOne,
    getList,
}
