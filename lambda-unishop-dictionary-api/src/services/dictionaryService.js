
const DbCalls = require('../utils/DbCalls')

const combineCommandSearch = (keyword, allowSearchColumns, prefixTable = '') => {
    const searchCondition = allowSearchColumns
        .map(colName => `${prefixTable}${colName} LIKE '%${keyword}%'`)
        .join(' OR ')

    return !!searchCondition ? ` (${searchCondition})` : ``
}

const getListOfLanguages = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `SHOW COLUMNS FROM unishop_dictionary;`
        const dt = await dbCalls.excuteQuery({ sql })
        const regxCol = /^dic_/

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

const getList = async (listOfLanguage, options) => {
    const {
        skip = 0,
        limit = 0,
        keywords = [],
        sortings = {},
        filterNullColumnsOr = [],
        filterIn = {},
        withHistory = false,
    } = options || {}

    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfDictColumns = listOfLanguage.map(code => `d.dic_${code}`)
        const listOfNullColumns = filterNullColumnsOr.map(code => `d.dic_${code}`)
        const listOfInConditions = Object.keys(filterIn).map(col => ` d.${col} IN (${filterIn[col].map(value => `\"${value}\"`).join(", ")})`)

        let sql = `SELECT`
        if (listOfLanguage.length > 0) {
            sql += ` d.id, d.updatedBy, d.updatedAt, d.note, ${listOfDictColumns.join(`, `)}`
        } else {
            sql += ` d.*`
        }

        // ColumnsHistory
        if (withHistory) {
            const listOfHistories = listOfLanguage.map(code => `t_${code}.history_${code}`)
            sql += `, ${listOfHistories.join(', ')}`

            const listOfLastHistory = listOfLanguage.map(code => `l_${code}.lastHistory_${code}`)
            sql += `, ${listOfLastHistory.join(', ')}`
        }

        sql += ` FROM unishop_dictionary AS d`

        if (withHistory) {
            const listOfJoinHistory = listOfLanguage.map(code => ` LEFT OUTER JOIN (
                SELECT dictionaryId, GROUP_CONCAT(id ORDER BY updatedAt DESC) AS history_${code}
                FROM unishop_dictionary_history 
                WHERE languageCode = '${code}'
                GROUP BY dictionaryId
            ) AS t_${code} ON t_${code}.dictionaryId = d.id`)
            sql += listOfJoinHistory.join(` `)

            const listOfLastHistory = listOfLanguage.map(code => ` LEFT OUTER JOIN (
                SELECT tlh.dictionaryId, tlh.id AS lastHistory_${code} FROM unishop_dictionary_history AS tlh
                RIGHT JOIN (
                    SELECT dictionaryId, languageCode, MAX(updatedAt) AS updatedAt 
	                FROM unishop_dictionary_history WHERE languageCode='${code}' GROUP BY dictionaryId, languageCode
                ) AS tlu ON tlh.dictionaryId = tlu.dictionaryId
                    AND tlh.languageCode = tlu.languageCode
                    AND tlh.updatedAt = tlu.updatedAt
                WHERE tlh.languageCode='${code}'
                ORDER BY tlh.dictionaryId ASC, tlh.updatedAt
            ) AS l_${code} ON l_${code}.dictionaryId = d.id`)
            sql += listOfLastHistory.join(` `)
        }

        const listOfConditions = []

        // Filter by keywords
        const searchColumns = [
            `d.id`,
            `d.note`,
            ...listOfDictColumns,
        ]
        const listOfSqlSearch = keywords.reduce((list, k) => [...list, combineCommandSearch(k, searchColumns)], [])
        if (listOfSqlSearch.length > 0) listOfConditions.push(listOfSqlSearch.join(` AND `))

        // Filter Is Null Or
        if (listOfNullColumns.length > 0) listOfConditions.push(listOfNullColumns.map(col => `TRIM(${col}) = ""`).join(` OR `))

        // Append Conditions
        if (listOfConditions.length > 0 || listOfInConditions.length > 0) sql += ` WHERE`
        if (listOfConditions.length > 0) sql += ` ${listOfConditions.map(condition => `(${condition})`).join(' AND ')}`
        if (listOfInConditions.length > 0) sql += ` ${listOfInConditions.map(condition => `(${condition})`).join(' AND ')}`

        // Sortings
        const sortingsColumns = [
            `d.id`,
            `d.createdBy`,
            `d.createdAt`,
            `d.updatedBy`,
            `d.updatedAt`,
            ...listOfDictColumns,
        ]
        const listOfSqlSortings = Object.keys(sortings)
            .filter(col => sortingsColumns.includes(`d.${col}`))
            .filter(col => [`ASC`, `DESC`].includes(sortings[col].toUpperCase()))
            .map(col => `d.${col} ${sortings[col].toUpperCase()}`)

        // Order by
        if (listOfSqlSortings.length > 0) sql += ` ORDER BY ${listOfSqlSortings.join(`, `)}`

        // Skip, Limit
        if (skip || limit) sql += ` LIMIT ${skip}, ${limit}`

        const dt = await dbCalls.excuteQuery({ sql })
        return dt.map(r => Object.keys(r).reduce((obj, key) => ({
            ...obj,
            [key]: /^history_/.test(key)
                ? r[key]
                    ? r[key].split(",").map(id => parseInt(id))
                    : []
                : r[key]
        }), {}))
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

        const sql = `SELECT * FROM unishop_dictionary WHERE id=?;`
        const values = [id]
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

const editMultiple = async editDataList => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let values = []
        const listOfSqlUpdate = editDataList.map(row => {
            const { id, ...cols } = row
            const listOfSetValue = Object.keys(cols).map(colName => `${colName}=?`)
            const rowValues = Object.keys(cols).map(colName => row[colName])
            values = [...values, ...rowValues]
            return `UPDATE unishop_dictionary SET ${listOfSetValue.join(`,`)} WHERE id="${id}";`
        })

        const sql = listOfSqlUpdate.join("\n");
        await dbCalls.excuteQuery({ sql, values })

        return editDataList
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const add = async newData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfCols = Object.keys(newData).map(col => col)
        const listOfSetValues = Object.keys(newData).map(() => `?`)
        const values = Object.keys(newData).map(col => newData[col])

        const sql = `INSERT INTO unishop_dictionary (${listOfCols.join(",")}) VALUES (${listOfSetValues.join(",")});`
        await dbCalls.excuteQuery({ sql, values })

        return newData
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

        const sql = `DELETE FROM unishop_dictionary WHERE id=?;`
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
    getListOfLanguages,
    getList,
    getById,
    editMultiple,
    add,
    deleteById,
}