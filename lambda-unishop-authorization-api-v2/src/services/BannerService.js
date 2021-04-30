const DbCalls = require('../utils/DbCalls')

const QUERY_COLS = [
    "id",
    "countryCode",
    "isEnable",
    "sorting",
    "isLoginRequired",
    "isDisableOnLogin",
    "usageType",
    "path_english",
    "path_native",
    "externalLinkTarget",
    "externalLink_english",
    "externalLink_native",
    "imageUrls_english",
    "imageUrls_native",
    "handleFunction_english",
    "handleFunction_native",
    "bannerImageUrl_english",
    "bannerImageUrl_native",
    "createdBy",
    "createdAt",
    "updatedBy",
    "updatedAt",
]
const TEXT_OBJECT_COLS = [
    "path",
    "externalLink",
    "handleFunction",
    "showtimeBefore",
    "showtimeAfter",
    "handleFunction",
    "bannerImageUrl",
]
const JSON_OBJECT_COLS = [
    "imageUrls"
]

const BOOLEAN_COLS = [
    "isEnable",
    "isLoginRequired",
    "isDisableOnLogin",
]

const ARRAY_COLS = [

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

        const sql = `INSERT INTO unishop_banners (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const editArrow = async data => {
    const dbCalls = new DbCalls()
    const id = 6
    try {
        await dbCalls.connect()
        const sql = `UPDATE unishop_files_2 SET url=? WHERE id=?`
        const values = [data, id]
        await dbCalls.excuteQuery({ sql, values })
        return true
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

        const sql = `SELECT ${QUERY_COLS.join(",")} FROM unishop_banners WHERE id=?;`
        const values = [id]
        const dt = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = dt || []

        if (!firstRow) {
            return firstRow
        }
        return toObjData(firstRow)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

// const getList = async (country_code) => {
//     const dbCalls = new DbCalls()
//     try {
//         await dbCalls.connect()

//         const sql = `SELECT * FROM unishop_banners where countryCode=?`
//         const values = [country_code]
//         const result = await dbCalls.excuteQuery({ sql, values })

//         return result
//     } catch (err) {
//         console.error(err)
//         throw err
//     } finally {
//         if (dbCalls) await dbCalls.disconnect()
//     }
// }
const getArrow = async () => {
    const dbCalls = new DbCalls()
    const id = 6
    try {
        await dbCalls.connect()
        const sql = `SELECT url from unishop_files_2 WHERE id=? `
        const values = [id]
        const result = await dbCalls.excuteQuery({ sql, values })
        return result
    } catch (e) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getList = async ({
    equalAnd = {},
    inAnd = {}
}) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = [
            `SELECT`,
            QUERY_COLS.join(","),
            `FROM unishop_banners`,
        ]

        let cmdConditions = []
        let values = []

        const equalAndCmd = Object.keys(equalAnd).map(col => `${col}=?`).join(" AND ")
        const equalAndValues = Object.keys(equalAnd).map(col => equalAnd[col])
        if (equalAndCmd.length > 0) {
            cmdConditions.push(`(${equalAndCmd})`)
            values.push(...equalAndValues)
        }

        const inCmd = Object.keys(inAnd)
            .map(col => `${col} IN (${Array(inAnd[col].length).fill().map(_ => "?").join(",")})`).join(" AND ")
        const inValues = Object.keys(inAnd).reduce((list, col) => [...list, ...inAnd[col]], [])
        if (inCmd.length > 0) {
            cmdConditions.push(`(${inCmd})`)
            values.push(...inValues)
        }

        if (cmdConditions.length > 0) sql.push(`WHERE ${cmdConditions.join(" AND ")}`)

        sql.push("ORDER BY sorting ASC")

        const rowDataList = await dbCalls.excuteQuery({ sql: `${sql.join(" ")};`, values })
        return rowDataList.map(r => toObjData(r))
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getListPublic = async ({
    equalAnd = {},
    inAnd = {}
}) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = [
            `SELECT`,
            QUERY_COLS.join(","),
            `FROM unishop_banners`,
        ]

        let cmdConditions = []
        let values = []

        const equalAndCmd = Object.keys(equalAnd).map(col => `${col}=?`).join(" AND ")
        const equalAndValues = Object.keys(equalAnd).map(col => equalAnd[col])
        if (equalAndCmd.length > 0) {
            cmdConditions.push(`(${equalAndCmd})`)
            values.push(...equalAndValues)
        }

        const inCmd = Object.keys(inAnd)
            .map(col => `${col} IN (${Array(inAnd[col].length).fill().map(_ => "?").join(",")})`).join(" AND ")
        const inValues = Object.keys(inAnd).reduce((list, col) => [...list, ...inAnd[col]], [])
        if (inCmd.length > 0) {
            cmdConditions.push(`(${inCmd})`)
            values.push(...inValues)
        }

        if (cmdConditions.length > 0) sql.push(`WHERE ${cmdConditions.join(" AND ")}`)

        sql.push("ORDER BY sorting ASC")

        const rowDataList = await dbCalls.excuteQuery({ sql: `${sql.join(" ")};`, values })
        return rowDataList.map(r => toObjData(r))
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const editMultiple = async editList => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let values = []
        const listOfSqlUpdate = editList.map(row => {
            const editRow = toRowData(row)
            const { id, ...cols } = editRow

            const listOfSetValue = Object.keys(cols).map(colName => `${colName}=?`)
            const rowValues = Object.keys(cols).map(colName => editRow[colName])
            values = [...values, ...rowValues, id]
            return `UPDATE unishop_banners SET ${listOfSetValue.join(`,`)} WHERE id=?`
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

const deleteById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `DELETE FROM unishop_banners WHERE id=?;`
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
    getById,
    getList,
    editMultiple,
    deleteById,
    getListPublic,
    getArrow,
    editArrow
}
