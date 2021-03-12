const DbCalls = require('../utils/DbCalls')

const insert = async replaceData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfCols = Object.keys(replaceData).map(col => col)
        const listOfSetValues = Object.keys(replaceData).map(() => `?`)
        const values =  Object.keys(replaceData).map(col => replaceData[col])

        const sql = `INSERT INTO data_broker (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`

        return await dbCalls.excuteQuery({ sql,values })
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
        
        const sql = `SELECT * FROM data_broker WHERE id=?`
        const values = [id]
        let [firstRow] = await dbCalls.excuteQuery({ sql, values })

        if (firstRow){
            const { payload } = firstRow || {}
            firstRow = {
                ...firstRow, 
                payload: JSON.parse(payload)
            }
        }
        
        return firstRow
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const deleteOne = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `DELETE FROM data_broker WHERE id=?;`
        const values = [id]

        return dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    insert,
    getOne,
    deleteOne,
}