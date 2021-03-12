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
        if (/^style_/.test(key)) {
            obj = toGroupObjValue(obj, "style", key, rawData)
        } else if (/^text_/.test(key)) {
            obj = toGroupObjValue(obj, "text", key, rawData)
        } else if (['is_system_tags'].includes(key)) {
            obj = { ...obj, [key]: !!rawData[key] }
        } else {
            obj = { ...obj, [key]: rawData[key] }
        }
        return obj
    }, {})

const toRaw = objData => Object
    .keys(objData)
    .reduce((obj, key) => {
        if ([`style`, `text`].includes(key)) {
            obj = extractGroupValue(obj, key, objData)
        } else {
            obj = { ...obj, [key]: objData[key] }
        }
        return obj
    }, {})

const toTagNativeLanguage = (r, nativeLanguageCode) => {
    const { text, ...otherColumns } = r
    return {
        ...otherColumns,
        text: {
            english: text.EN,
            native: nativeLanguageCode ? text[nativeLanguageCode] : null
        }
    }
}

const getListOfLanguages = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `SHOW COLUMNS FROM products_tags;`
        const dt = await dbCalls.excuteQuery({ sql })
        const regxCol = /^text_/

        return dt.map(({ Field }) => Field)
            .filter(col => regxCol.test(col))
            .map(code => code.replace(regxCol, ""))

    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getList = async options => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const {
            inListOfTagId = [],
            is_system_tags = null,
        } = options || {}

        let sql = [`SELECT * FROM products_tags`]
        let conditions = []
        let values = []

        if (inListOfTagId.length > 0) {
            conditions.push(`id IN (${inListOfTagId.join(",")})`)
            values.push(...inListOfTagId)
        }

        if (is_system_tags != null) {
            conditions.push(`is_system_tags=?`)
            values.push(is_system_tags ? 1 : 0)
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

const getListDisplayNative = async (nativeLanguageCode, options) => {
    const list = await getList(options)
    return list.map(r => toTagNativeLanguage(r, nativeLanguageCode))
}

const getById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT * FROM products_tags WHERE id=?`
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
        const productExcuteParams = toCmdInsert(`products_tags`, rowData)

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

        const excuteParams = toCmdDelete(`products_tags`, { id })

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
            .map(({ id, ...updateData }) => toCmdUpdate('products_tags', { id }, updateData))
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
    getListOfLanguages,
    getList,
    getListDisplayNative,
    getById,
    create,
    removeById,
    editMultiple,

}