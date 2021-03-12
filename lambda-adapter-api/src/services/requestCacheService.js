const DbCalls = require('../utils/DbCalls')

const getById = async (tag,id) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `SELECT * FROM request_cache WHERE tag=? AND id=?;`
        const values = [tag,id]
        const dt = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = dt || []

        return firstRow
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const replace = async newData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfCols = Object.keys(newData).map(col => col)
        const listOfSetValues = Object.keys(newData).map(() => `?`)
        const values =  Object.keys(newData).map(col => newData[col])

        const sql = `REPLACE INTO request_cache (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`
        await dbCalls.excuteQuery({ sql,values })

        return newData
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const update = async (tag, id ,editData) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfSetValues = Object.keys(editData).map(col => `${col}=?`)
        let values =  Object.keys(editData).map(col => editData[col])

        const sql = `UPDATE request_cache SET ${listOfSetValues.join(",")} WHERE tag=? AND id=?;`
        values = [...values, tag, id]

        await dbCalls.excuteQuery({ sql,values })

        return editData
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getList = async options => {
    const {
        skip = 0,
        limit = 0,
        keywords = [],
        sortings = {},
        filters = {},
        filterNullColumnsOr = [],
    } = options || {}

    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        let sql = `SELECT tag, id, timestamp, value, baId, requestData, usageCounter FROM request_cache`

        const sqlFilters = Object.keys(filters).map(key => `${key} ${filters[key]}`)
        if (sqlFilters.length > 0) sql += ` WHERE ${sqlFilters.join(" AND ")}`

        // Skip, Limit
        if (skip || limit) sql += ` LIMIT ${skip}, ${limit}`

        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getListOfBaId = async options => {
    const {
        filters = {},        
    } = options || {}

    const dbCalls = new DbCalls()

    try{
        await dbCalls.connect()

        let sql = `SELECT DISTINCT baId FROM request_cache`

        const sqlFilters = Object.keys(filters).map(key => `${key} ${filters[key]}`)
        if (sqlFilters.length > 0) sql += ` WHERE ${sqlFilters.join(" AND ")}`

        const results = await dbCalls.excuteQuery({ sql })
        return results.map(r => r.baId)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    getById,
    replace,
    update,
    getList,
    getListOfBaId,
}