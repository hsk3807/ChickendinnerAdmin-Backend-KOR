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

const create = async newData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfCols = Object.keys(newData).map(col => col)
        const listOfSetValues = Object.keys(newData).map(() => `?`)
        const values =  Object.keys(newData).map(col => newData[col])

        const sql = `INSERT INTO unishop_home (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`
        await dbCalls.excuteQuery({ sql,values })

        return parseObj(newData)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getOne = async countryCode => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT * FROM unishop_home` +
            ` WHERE countryCode=?;`

        const values = [countryCode]

        const result = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = result

        return parseObj(firstRow)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateOne = async (countryCode, editData) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        

        const setCols = Object.keys(editData).map(col => `${col}=?`)
        const setValues = Object.keys(editData).map(col => editData[col])

        const sql = `UPDATE unishop_home SET ${setCols.join(',')} WHERE countryCode = ?`

        const values = [...setValues, countryCode]

        const result = await dbCalls.excuteQuery({ sql, values })
        
        return result
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    create,
    getOne,
    updateOne,
}