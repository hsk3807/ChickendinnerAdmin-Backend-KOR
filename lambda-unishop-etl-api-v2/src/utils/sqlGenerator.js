
const toCmdUpdate = (tableName, uniqueKeys, updateData) => {
    // TODO:- VVV no handle NULL value
    const updateStatement = Object.keys(updateData).map(col => `${col}=?`).join(',')
    const updateValues = Object.keys(updateData).map(col => updateData[col])
    const keyStatement = Object.keys(uniqueKeys).map(col => `${col}=?`).join(' AND ')
    const keyValues = Object.keys(uniqueKeys).map(col => uniqueKeys[col])

    return {
        uniqueKeys,
        sql: `UPDATE ${tableName} SET ${updateStatement} WHERE ${keyStatement};`,
        values: [...updateValues, ...keyValues]
    }
}

const toCmdInsert = (tableName, insertData) => {
    const insertStatement = Object.keys(insertData).join(`,`)
    const insertParams = Object.keys(insertData)
        .map(col => insertData[col] === null ? `NULL` : `?`)
        .join(`,`)
    const insertValues = Object.keys(insertData)
        .filter(col => insertData[col] !== null)
        .map(col => insertData[col])
    return {
        sql: `INSERT INTO ${tableName} (${insertStatement}) VALUES (${insertParams});`,
        values: insertValues,
    }
}

const toCmdDelete = (tableName, uniqueKeys) => {
    const keyStatement = Object.keys(uniqueKeys).map(col => `${col}=?`).join(' AND ')
    const keyValues = Object.keys(uniqueKeys).map(col => uniqueKeys[col])
    return {
        sql: `DELETE FROM ${tableName} WHERE ${keyStatement};`,
        values: keyValues
    }
}

const combileExcuteParams = (obj, r) => {
    let { sql = ``, values = [] } = r
    if (!obj) obj = {}

    obj.sql = (obj.sql || ``) + sql
    obj.values = [...(obj.values || []), ...values]

    return obj
}

module.exports = {
    toCmdInsert,
    toCmdUpdate,
    toCmdDelete,
    combileExcuteParams,
}