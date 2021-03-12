const db = require('../utils/dbConnector');
const { httpStatus, createServiceError } = require('../utils/helpers')

const tableName = process.env.DYNAMODB_TABLE_MAIN

module.exports.create = async newCountry => {
    const { countryCode, languagesUsage = [] } = newCountry
    const listPartition = 'list'
    const listKey = 'countryCodes'
    const itemPartition = 'items'
    const itemKey = countryCode

    const { Item: existsBanner } = await db.get(tableName, itemPartition, itemKey)
    if (existsBanner) return createServiceError(httpStatus.Conflict, `${countryCode} already exists.`)

    const { Item: existsCountryList } = await db.get(tableName, listPartition, listKey)
    const { list: existsList } = existsCountryList || {}
    const countryList = existsList ? { list: [...existsList, itemKey] } : { list: [itemKey] }

    await db.replace(tableName, listPartition, listKey, countryList)
    const data = await db.insert(tableName, itemPartition, itemKey, { list: [], languagesUsage })

    return { data }
}

module.exports.getList = async () => {
    const listPartition = 'list'
    const listKey = 'countryCodes'

    const { Item: existsCountryList } = await db.get(tableName, listPartition, listKey)
    const { list: data } = existsCountryList || {}

    return { data }
}
