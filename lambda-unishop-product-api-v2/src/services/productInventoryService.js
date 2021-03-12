const DbCalls = require('../utils/DbCalls')
const {
    toJsonArray,
    toStringArray,
    toGroupObjValue,
    toGroupObjArray,
    toGroupObjBool,
    extractGroupBool,
    extractGroupValue,
    extractGroupArray,
} = require("../utils/dataTransformHelper")
const {
    toCmdInsert,
    toCmdUpdate,
    toCmdDelete,
    combileExcuteParams,
} = require("../utils/sqlGenerator")

const toRaw = objData => Object
    .keys(objData)
    .reduce((obj, key) => {
        if (['is_enable', 'is_allow_backorder'].includes(key)) {
            obj = { ...obj, [key]: objData[key] ? 1 : 0 }
        } else if (['qty'].includes(key)) {
            obj = extractGroupValue(obj, key, objData)
        } else {
            obj = { ...obj, [key]: objData[key] }
        }
        return obj
    }, {})

const editMultiple = async editDataList => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const editInventory = editDataList.map(toRaw)
        const excuteParams = editInventory
            .map(({ id, ...updateData }) => toCmdUpdate('products_inventory', { id }, updateData))
            .reduce(combileExcuteParams, null)

        return dbCalls.excuteQuery(excuteParams)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const createMultiple = async newDataLise => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const addInventory = newDataLise.map(toRaw)
        const excuteParams = addInventory
            .map(rowData => toCmdInsert(`products_inventory`, rowData))
            .reduce(combileExcuteParams, null)
        return dbCalls.excuteQuery(excuteParams)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const removeByIdMultiple = async (listOfId = []) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const excuteParams = listOfId
            .map(id => toCmdDelete(`products_inventory`, { id }))
            .reduce(combileExcuteParams, null)

        return dbCalls.excuteQuery(excuteParams)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getList =  async ({
    listOfId = [],
    listOfProductId = [],
    skip = 0,
    limit = 99,
}) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const queryDefault = [
            'SELECT * FROM `products_inventory`'
        ]

        let sql = [...queryDefault]
        let values = []
        let conditions = []
        
        if (listOfId.length > 0){
            conditions.push(`id IN (${listOfId.map(_ => '?').join(",")})`)
            values.push(...listOfId)
        }

        if (listOfProductId.length > 0){
            conditions.push(`product_id IN (${listOfProductId.map(_ => '?').join(",")})`)
            values.push(...listOfProductId)
        }

        if (conditions.length > 0) sql.push(` WHERE ${conditions.join(" AND ")}`)
        sql.push(`LIMIT ${skip}, ${limit}`)

        const dt = await dbCalls.excuteQuery({ sql: sql.join(" "), values })
        return dt
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    editMultiple,
    createMultiple,
    removeByIdMultiple,
    getList,
}