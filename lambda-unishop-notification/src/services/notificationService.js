const DbCalls = require('../utils/DbCalls')
const aws = require('aws-sdk');
const { default: axios } = require('axios');
const lambda = new aws.Lambda();

const QUERY_COLS = [
    "id",
    "countryCode",
    "type",
    "allowOnlyStatus",
    "allowOnlyBa",
    "allowOnlyMarket",
    "isEnable",
    "isShowOnce",
    "showPage",
    // "isLoginRequired",
    // "isDisableOnLogin",
    "usageType",
    "text_english",
    "text_native",
    "imageUrls_english",
    "imageUrls_native",
    "createdBy",
    "createdAt",
    "updatedBy",
    "updatedAt",
]
const TEXT_OBJECT_COLS = [
    "text",
    "imageUrls"
]
const JSON_OBJECT_COLS = [

]

const BOOLEAN_COLS = [
    "isEnable",
    // "isShowOnce",
    // "isLoginRequired",
    // "isDisableOnLogin",
]

const ARRAY_COLS = [
    "allowOnlyStatus",
    "allowOnlyBa",
    "allowOnlyMarket",
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
        }
        // else if (regxJsonObjectCols.test(col)) {
        //     const [displayCol, subCol] = col.split("_")
        //     const jsonObj = {
        //         ...(obj[displayCol] || {}),
        //         [subCol]: JSON.parse(rowData[col] || "null")
        //     }
        //     return { ...obj, [displayCol]: jsonObj }
        // } 
        else if (BOOLEAN_COLS.includes(col)) {
            return { ...obj, [col]: !!rowData[col] }
        }
        else if (ARRAY_COLS.includes(col)) {
            return { ...obj, [col]: JSON.parse(rowData[col] ? rowData[col] : "[]") }
        } else {
            return { ...obj, [col]: rowData[col] }
        }
    }, {})

const getData = async ({
    equalAnd = {},
    inAnd = {}
}) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = [
            `SELECT`,
            QUERY_COLS.join(","),
            `FROM unishop_popup`,
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

        sql.push("ORDER BY sorting ASC, id DESC")

        const rowDataList = await dbCalls.excuteQuery({ sql: `${sql.join(" ")};`, values })

        return rowDataList.map(r => toObjData(r))
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

        const sql = `SELECT ${QUERY_COLS.join(",")} FROM unishop_popup WHERE id=?;`
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
            return `UPDATE unishop_popup SET ${listOfSetValue.join(`,`)} WHERE id=?`
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

const create = async newData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const newCreateData = toRowData(newData)

        const listOfCols = Object.keys(newCreateData).map(col => col)
        const listOfSetValues = Object.keys(newCreateData).map(() => `?`)
        const values = Object.keys(newCreateData).map(col => newCreateData[col])

        const sql = `INSERT INTO unishop_popup (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`

        return await dbCalls.excuteQuery({ sql, values })
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

        const sql = `DELETE FROM unishop_popup WHERE id=?;`
        const values = [id]

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getReadPopup = async (baId) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `SELECT * from unishop_popup_read WHERE dist_id = ?`
        const values = [baId]

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const readPopupAck = async (popupId, baId) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `INSERT INTO unishop_popup_read (dist_id, popup_id) VALUES (? , ?);`
        const values = [baId, popupId]

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}


module.exports = {
    getData,
    getById,
    editMultiple,
    create,
    deleteById,
    getReadPopup,
    readPopupAck
}
