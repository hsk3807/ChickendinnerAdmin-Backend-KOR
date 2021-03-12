
const DbCalls = require('../utils/DbCalls')

const COLUMNS_FILTER = [`warehouse`, `payment_status`]
const COLUMNS_BETWEEN = [`stamp_created`]
const COLUMNS_SEARCH = [
    `reference_id`,
    `order_id`,
    `approval_code`,
    `enroller_id`,
    `sponsor_id`,
    `referral_id`,
    `login_id`,
    `new_id`,
    `request_data`,
    `notes`,
    `card_holder`,
    `card_no`
]

const genConditionIn = (columnName, filters, prefixTable = '', isNot = false) => {
    let conditionIn
    if (filters.length > 0) {
        const [firstValue] = filters

        if (firstValue === 'null') {
            conditionIn = `${prefixTable}${columnName} IS NULL`
        } else {
            const conditionsString = filters.map(value => `'${value}'`)
            conditionIn = `${prefixTable}${columnName} ${isNot ? 'NOT' : ''} IN (${conditionsString})`
        }
    }
    return conditionIn
}

const genConditionBetween = (columnName, between, prefixTable = '') => {
    const { start, end } = between || {}
    const timeStampColumns = ['stamp_created']
    const isTimeStamp = timeStampColumns.includes(columnName)
    return isTimeStamp
        ? `UNIX_TIMESTAMP(${prefixTable}${columnName}) BETWEEN ${start} AND ${end}`
        : `${prefixTable}${columnName} BETWEEN '${start}' AND '${end}'`
}

const combineCommandFilter = (sql, filter, allowFilterColumns, prefixTable = '') =>
    allowFilterColumns.reduce((tempSql, colName) => {
        if (filter[colName]) {
            const conditionIn = genConditionIn(colName, filter[colName], prefixTable)
            if (conditionIn) tempSql += ` AND ${conditionIn}`
        }
        return tempSql
    }, sql)

const combineCommandNotFilter = (sql, filter, allowFilterColumns, prefixTable = '') =>
    allowFilterColumns.reduce((tempSql, colName) => {
        if (filter[colName]) {
            const conditionIn = genConditionIn(colName, filter[colName], prefixTable, true)
            if (conditionIn) tempSql += ` AND ${conditionIn}`
        }
        return tempSql
    }, sql)

const combineCommandBetween = (sql, between, allowBetweenColumns, prefixTable = '') =>
    allowBetweenColumns.reduce((tempSql, colName) => {
        if (between[colName]) {
            const conditionBetween = genConditionBetween(colName, between[colName], prefixTable)
            if (conditionBetween) tempSql += ` AND ${conditionBetween}`
        }
        return tempSql
    }, sql)

const combineCommandSearch = (keyword, allowSearchColumns, prefixTable = '') => {
    const searchCondition = allowSearchColumns
        .map(colName => `${prefixTable}${colName} LIKE '%${keyword}%'`)
        .join(' OR ')

    return !!searchCondition ? ` AND (${searchCondition})` : ``
}



module.exports.getCount = async (
    countryCode,
    {
        filter,
        notFilter,
        between,
        keyword,
    }
) => {
    const dbCalls = new DbCalls()

    try {
        await dbCalls.connect()

        let sql = `SELECT COUNT(*) AS count` +
            ` FROM unishop_payment AS p` +
            ` WHERE p.country_code=?`

        // Filter
        if (filter) sql = combineCommandFilter(sql, filter, COLUMNS_FILTER, 'p.')

        // Filter Not
        if (notFilter) sql = combineCommandNotFilter(sql, notFilter, COLUMNS_FILTER, 'p.')

        // Between
        if (between) sql = combineCommandBetween(sql, between, COLUMNS_BETWEEN, 'p.')

        // Search
        if (keyword) sql += combineCommandSearch(keyword, COLUMNS_SEARCH, 'p.')

        // Order
        sql += ` ORDER BY p.stamp_created DESC`

        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })
        const [row] = result
        const { count } = row
        return count
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}


module.exports.getList = async (
    countryCode,
    {
        filter,
        notFilter,
        between,
        skip = 0,
        limit = 0,
        keyword,
    }
) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let sql = `SELECT` +
            ` p.id,` +
            ` p.country_code,` +
            ` p.warehouse,` +
            ` p.reference_id,` +
            ` p.payment_status,` +
            ` p.order_id,` +
            ` UNIX_TIMESTAMP(p.stamp_created) AS stamp_created,` +
            ` p.type,` +
            ` p.login_id,` +
            ` p.referral_id,` +
            ` p.new_id` +
            ` FROM unishop_payment AS p` +
            ` WHERE p.country_code=?`

        // Filter
        if (filter) sql = combineCommandFilter(sql, filter, COLUMNS_FILTER, 'p.')

        // Filter Not
        if (notFilter) sql = combineCommandNotFilter(sql, notFilter, COLUMNS_FILTER, 'p.')

        // Between
        if (between) sql = combineCommandBetween(sql, between, COLUMNS_BETWEEN, 'p.')

        // Search
        if (keyword) sql += combineCommandSearch(keyword, COLUMNS_SEARCH, 'p.')

        // Sorting
        sql += ` ORDER BY p.stamp_created DESC`

        // Skip, Limit
        sql += ` LIMIT ${skip}, ${limit}`
        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })

        return result
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getPaymentStatusList = async (countryCode) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let sql = `SELECT DISTINCT p.payment_status` +
            ` FROM unishop_payment AS p` +
            ` WHERE p.country_code=?`

        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })

        return result.map(({ payment_status }) => payment_status)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}
