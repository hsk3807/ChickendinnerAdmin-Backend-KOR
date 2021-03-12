const DbCalls = require('../utils/DbCalls')

const QUERY_COLS = [
    "id",
    "country",
    "type",
    "roman_name",
    "native_name",
    "test",
    "live",
    "short",
    "shorter",
    "enable",
    "maintenance",
    "text_english",
    "text_native",
    "fsb",
    "orderHistoryDownline"
]
const TEXT_OBJECT_COLS = [
    // "country",
    // "type",
    "text",
    // "roman_name",
    // "native_name",
    // "test",
    // "live",
    // "short",
    // "shorter",
]
const JSON_OBJECT_COLS = [
]

const BOOLEAN_COLS = [
    "enable",
    "fsb",
    "orderHistory"
]

const ARRAY_COLS = [
    "maintenance",
]

const regxTextObjectCols = new RegExp(`^${TEXT_OBJECT_COLS.map(k => `${k}_`).join("|")}`)
const regxJsonObjectCols = new RegExp(`^${JSON_OBJECT_COLS.map(k => `${k}_`).join("|")}`)

const toRowData = objData => Object.keys(objData)
    .reduce((obj, col) => {
        if (TEXT_OBJECT_COLS.includes(col)) {
            const objTextValues = Object.keys(objData[col])
                .reduce((o, key) => ({ ...o, [`${col}_${key}`]: objData[col][key] }), {})
            return { ...obj, ...objTextValues }

        } else if (JSON_OBJECT_COLS.includes(col)) {
            const objArrayValues = Object.keys(objData[col])
                .reduce((o, key) => ({ ...o, [`${col}_${key}`]: JSON.stringify(objData[col][key]) }), {})
            return { ...obj, ...objArrayValues }
        } else if (BOOLEAN_COLS.includes(col)) {
            return { ...obj, [col]: objData[col] ? 1 : 0 }
        } else if (ARRAY_COLS.includes(col)) {
            return { ...obj, [col]: JSON.stringify(objData[col] ? objData[col] : []) }
        } else {
            return { ...obj, [col]: objData[col] }
        }
    }, {})

const toObjData = rowData => Object.keys(rowData)
    .reduce((obj, col) => {
        if (regxTextObjectCols.test(col)) {
            const [displayCol, subCol] = col.split("_")
            const textObj = {
                ...(obj[displayCol] || {}),
                [subCol]: rowData[col]
            }
            return { ...obj, [displayCol]: textObj }
        } else if (regxJsonObjectCols.test(col)) {
            const [displayCol, subCol] = col.split("_")
            const jsonObj = {
                ...(obj[displayCol] || {}),
                [subCol]: JSON.parse(rowData[col] || "null")
            }
            return { ...obj, [displayCol]: jsonObj }
        } else if (BOOLEAN_COLS.includes(col)) {
            return { ...obj, [col]: !!rowData[col] }
        } else if (ARRAY_COLS.includes(col)) {
            return { ...obj, [col]: JSON.parse(rowData[col] ? rowData[col] : "[]") }
        } else {
            return { ...obj, [col]: rowData[col] }
        }
    }, {})

const create = async newData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const newCreateData = toRowData(newData)

        const listOfCols = Object.keys(newCreateData).map(col => col)
        const listOfSetValues = Object.keys(newCreateData).map(() => `?`)
        const values = Object.keys(newCreateData).map(col => newCreateData[col])

        const sql = `INSERT INTO unishop_country (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const countrySelect = async (type) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = [
            `SELECT`,
            QUERY_COLS.join(","),
            `FROM unishop_country WHERE type=? 
            ORDER BY country ASC`,
        ]
        const values = [type]
        const rowDataList = await dbCalls.excuteQuery({ sql: `${sql.join(" ")};`, values })
        return rowDataList
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const backgroundImageCountrySelect = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT url FROM unishop_files_2 WHERE id=1 or id=2 or id=3 or id=4 or id=5`
        let data = await dbCalls.excuteQuery({ sql })
        return JSON.stringify(data)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const backgroundImageCountrySelectExpress = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT url FROM unishop_files_2 WHERE id=7 or id=8 or id=9 or id=10 or id=11`
        let data = await dbCalls.excuteQuery({ sql })
        return JSON.stringify(data)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const upDateCountry = async (data) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let values = []

        const listOfSqlUpdate = data.map(row => {
            const editRow = toRowData(row)
            const { id, ...cols } = editRow

            const listOfSetValue = Object.keys(cols).map(colName => `${colName}=?`)
            const rowValues = Object.keys(cols).map(colName => editRow[colName])
            values = [...values, ...rowValues, id]
            return `UPDATE unishop_country SET ${listOfSetValue.join(`,`)} WHERE id=?`
        })

        const sql = listOfSqlUpdate.join(";");
        return dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateBgImage = async (bg, icon, logo, title) => {
    const dbCalls = new DbCalls()
    const bg_desktop = bg.desktop
    const bg_mobile = bg.mobile
    const icon_ = icon
    const logo_ = logo
    const title_ = title

    try {
        await dbCalls.connect()
        let sql = `UPDATE unishop_files_2 SET url=? WHERE id=?`
        let values = [bg_desktop, 1]
        await dbCalls.excuteQuery({ sql, values })
        values = [bg_mobile, 2]
        await dbCalls.excuteQuery({ sql, values })
        values = [icon_, 3]
        await dbCalls.excuteQuery({ sql, values })
        values = [logo_, 4]
        await dbCalls.excuteQuery({ sql, values })
        values = [title_, 5]
        await dbCalls.excuteQuery({ sql, values })
        // await dbCalls.excuteQuery({ sql, values2 })
        return true
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateBgImageExpress = async (bg, icon, logo, title) => {
    const dbCalls = new DbCalls()
    const bg_desktop = bg.desktop
    const bg_mobile = bg.mobile
    const icon_ = icon
    const logo_ = logo
    const title_ = title

    try {
        await dbCalls.connect()
        let sql = `UPDATE unishop_files_2 SET url=? WHERE id=?`
        let values = [bg_desktop, 7]
        await dbCalls.excuteQuery({ sql, values })
        values = [bg_mobile, 8]
        await dbCalls.excuteQuery({ sql, values })
        values = [icon_, 9]
        await dbCalls.excuteQuery({ sql, values })
        values = [logo_, 10]
        await dbCalls.excuteQuery({ sql, values })
        values = [title_, 11]
        await dbCalls.excuteQuery({ sql, values })
        // await dbCalls.excuteQuery({ sql, values2 })
        return true
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const deleteById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `DELETE FROM unishop_country WHERE id=?;`
        const values = [id]

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    create,
    countrySelect,
    upDateCountry,
    updateBgImage,
    updateBgImageExpress,
    backgroundImageCountrySelect,
    backgroundImageCountrySelectExpress,
    deleteById
}




