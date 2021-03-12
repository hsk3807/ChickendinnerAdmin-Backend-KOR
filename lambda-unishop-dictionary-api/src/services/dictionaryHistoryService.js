
const DbCalls = require('../utils/DbCalls')

const addMultiple = async list => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let values = []
        const listOfSql = list.map(newData => {
            const listOfCols = Object.keys(newData).map(col => col)
            const listOfSetValues = Object.keys(newData).map(() => `?`)
            values = [...values, ...Object.keys(newData).map(col => newData[col])]
            return `INSERT INTO unishop_dictionary_history (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`
        })

        const sql = listOfSql.join("\n");
        return dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateMultiple = async editDataList => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        
        let values = []
        const listOfSqlUpdate = editDataList.map(row => {
            const { id, ...cols } = row
            const listOfSetValue = Object.keys(cols).map(colName => `${colName}=?`)
            const rowValues = Object.keys(cols).map(colName => row[colName])
            values = [...values, ...rowValues]
            return `UPDATE unishop_dictionary_history SET ${listOfSetValue.join(`,`)} WHERE id="${id}";`
        })
        
        const sql = listOfSqlUpdate.join("\n");
        return dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const deleteByDictionaryId = async dictionaryId => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `DELETE FROM unishop_dictionary_history WHERE dictionaryId=?;`
        const values = [dictionaryId]

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getExistsList = async compareRows => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const conditions = compareRows.map(r => {
            const cmd = Object.keys(r).map(key => `${key}=?`).join(" AND ")
            const values = Object.keys(r).map(key => r[key])

            return { cmd, values }
        })

        const sqlCondition = conditions.map(({ cmd }) => `(${cmd})`).join(` OR `)
        const sql = `SELECT * FROM unishop_dictionary_history WHERE ${sqlCondition}`
        const values = conditions.reduce((list, { values }) => [...list, ...values], [])

        return dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getOne = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `SELECT * FROM unishop_dictionary_history WHERE id=?`
        const values = [id]

        const result = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = result || []

        return firstRow
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    addMultiple,
    updateMultiple,
    deleteByDictionaryId,
    getExistsList,
    getOne,
}
