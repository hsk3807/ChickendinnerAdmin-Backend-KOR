const DbCalls = require('../utils/DbCalls')
const {
    toGroupObjValue,
    extractGroupValue
} = require("../utils/dataTransformHelper")
const {
    toCmdInsert,
    toCmdUpdate,
    toCmdDelete,
    combileExcuteParams,
} = require("../utils/sqlGenerator")

const toObj = rawData => Object
    .keys(rawData)
    .reduce((obj, key) => {
        if (/^name_/.test(key)) {
            obj = toGroupObjValue(obj, "name", key, rawData)
        } else {
            obj = { ...obj, [key]: rawData[key] }
        }
        return obj
    }, {})

const toRaw = objData => Object
    .keys(objData)
    .reduce((obj, key) => {
        if ([`name`].includes(key)) {
            obj = extractGroupValue(obj, key, objData)
        } else {
            obj = { ...obj, [key]: objData[key] }
        }
        return obj
    }, {})

const getList = async options => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const {
            country_code,
            inListOfId = [],
        } = options || {}

        let sql = [`SELECT * FROM products_categories`]
        let conditions = []
        let values = []

        if (country_code) {
            conditions.push(`country_code=?`)
            values.push(country_code)
        }

        if (inListOfId.length > 0) {
            conditions.push(`id IN (${inListOfId.join(",")})`)
            values.push(...inListOfId)
        }

        if (conditions.length > 0) sql.push(`WHERE ${conditions.join(" AND ")}`)

        sql.push(`ORDER BY sorting ASC`)
        const dt = await dbCalls.excuteQuery({ sql: sql.join(" "), values })

        return dt.map(toObj)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT * FROM products_categories WHERE id=?`
        const values = [id]
        const [firstRow] = await dbCalls.excuteQuery({ sql, values })
        return firstRow ? toObj(firstRow) : null
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const create = async objData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const rowData = toRaw(objData)
        const productExcuteParams = toCmdInsert(`products_categories`, rowData)

        const insertResult = await dbCalls.excuteQuery(productExcuteParams)

        return insertResult
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}


const removeById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const excuteParams = toCmdDelete(`products_categories`, { id })

        return dbCalls.excuteQuery(excuteParams)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const editMultiple = async editDataList => {
    const dbCalls = new DbCalls()

    try {
        await dbCalls.connect()

        const editProducts = editDataList.map(toRaw)

        // Excute Edit
        const productsExcuteParams = editProducts
            .map(({ id, ...updateData }) => toCmdUpdate('products_categories', { id }, updateData))
            .reduce(combileExcuteParams, null)

        return dbCalls.excuteQuery(productsExcuteParams)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    getList,
    getById,
    create,
    removeById,
    editMultiple,
}