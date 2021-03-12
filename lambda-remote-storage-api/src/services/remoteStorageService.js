const DbCalls = require('../utils/DbCalls')

const parseObj = rawData => {
    if (!rawData) return null
    const {data, ...otherData} = rawData
    const parseData = JSON.parse(data)
    return {
        ...otherData,
        ...parseData
    }
}

const replace = async replaceData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfCols = Object.keys(replaceData).map(col => col)
        const listOfSetValues = Object.keys(replaceData).map(() => `?`)
        const values =  Object.keys(replaceData).map(col => replaceData[col])

        const sql = `REPLACE INTO remote_storage (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`

        return await dbCalls.excuteQuery({ sql,values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getOne = async keyData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        
        const sql = `SELECT * FROM remote_storage WHERE keyData=?`
        const values = [keyData]
        const [firstRow] = await dbCalls.excuteQuery({ sql, values })
        return firstRow
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const deleteOne = async keyData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        
        const sql = `DELETE FROM remote_storage WHERE keyData=?`
        const values = [keyData]
        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}


module.exports = {
    replace,
    getOne,
    deleteOne,
}