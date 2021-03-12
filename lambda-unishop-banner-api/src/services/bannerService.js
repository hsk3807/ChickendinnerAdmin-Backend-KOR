const db = require('../utils/dbConnector');
const { httpStatus, toEmptyData, createServiceError } = require('../utils/helpers')

const tableName = process.env.DYNAMODB_TABLE_MAIN

const PARTITIONS = {
    ITEMS: "items"
}

module.exports.add = async newBanner => {
    const partition = PARTITIONS.ITEMS
    const { countryCode } = newBanner

    const { Item: banner } = await db.get(tableName, partition, countryCode)
    if (!banner) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const expression = 'set #list = list_append(if_not_exists(#list, :emptyList), :newBanner)'
    const names = {
        '#list': 'list'
    }
    const values = {
        ':newBanner': [newBanner],
        ':emptyList': []
    }

    const data = await db.update(
        tableName,
        partition,
        countryCode,
        { expression, names, values })

    return { data }
}

module.exports.update = async editBanner => {
    const partition = PARTITIONS.ITEMS
    const { countryCode, id } = editBanner

    const { Item: banner } = await db.get(tableName, partition, countryCode)
    if (!banner) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list } = banner
    const foundIndex = list.findIndex(r => r.id === id)
    if (foundIndex === -1) return createServiceError(httpStatus.notFound, `${id} Banner not found.`)

    const updateBanner = Object.assign(list[foundIndex], editBanner)

    list.splice(foundIndex, 1, updateBanner)

    const expression = 'set #list = :list'
    const names = {
        '#list': 'list'
    }
    const values = {
        ':list': list
    }
    const data = await db.update(
        tableName,
        partition,
        countryCode,
        { expression, names, values })

    return { data }
}

module.exports.remove = async deleteBanner => {
    const partition = PARTITIONS.ITEMS
    const { countryCode, id } = deleteBanner

    const { Item: banner } = await db.get(tableName, partition, countryCode)
    if (!banner) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list } = banner
    const foundBanner = list.find(r => r.id === id)
    if (!foundBanner) return createServiceError(httpStatus.notFound, `${id} Banner not found.`)

    const deletedBannerList = list.reduce((newList, r) => {
        if (r.id !== id) newList.push(r)
        return newList
    }, [])

    const expression = 'set #list = :deletedBannerList'
    const names = {
        '#list': 'list'
    }
    const values = {
        ':deletedBannerList': deletedBannerList
    }
    const data = await db.update(
        tableName,
        partition,
        countryCode,
        { expression, names, values })

    return { data }
}

module.exports.getList = async params => {
    const partition = PARTITIONS.ITEMS
    const { countryCode } = params

    const { Item: banner } = await db.get(tableName, partition, countryCode)
    if (!banner) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list = [] } = banner || {}
    const data = list

    return { data }
}

module.exports.getById = async params => {
    const partition = PARTITIONS.ITEMS
    const { countryCode, id } = params

    const { Item: banner } = await db.get(tableName, partition, countryCode)
    if (!banner) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list = [] } = banner || {}
    const data = list.find(r => r.id === id)

    return { data }
}

module.exports.updateList = async (countryCode, list) => {
    const partition = PARTITIONS.ITEMS
    const expression = 'set #list = :list'
    const names = {
        '#list': 'list'
    }
    const values = {
        ':list': list
    }
    const data = await db.update(
        tableName,
        partition,
        countryCode,
        { expression, names, values })

    return { data }
}

module.exports.getSchema = async params => {
    const partition = PARTITIONS.ITEMS
    const { countryCode } = params

    const { Item: banner } = await db.get(tableName, partition, countryCode)
    if (!banner) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list = [], languagesUsage = [] } = banner || {}
    const reOrderList = list.sort((r1, r2) => {
        if (r1.createdAt < r2.createdAt) return 1
        if (r1.createdAt > r2.createdAt) return -1
        return 0
    })

    const [lastCreated] = reOrderList
    delete lastCreated.updatedBy
    delete lastCreated.createdAt
    delete lastCreated.id
    delete lastCreated.updatedAt

    const defaultValues = {
        createdBy : null,
        publishDate: {
            begin: null,
            end: null
        },
        isActive: false,
    }
    Object.assign(lastCreated, defaultValues)
    toEmptyData(lastCreated, languagesUsage)

    const data = lastCreated
    return { data }
}