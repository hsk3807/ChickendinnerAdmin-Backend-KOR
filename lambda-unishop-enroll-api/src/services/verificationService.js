const DbCalls = require('../utils/DbCalls')
const S3Service = require("../utils/s3Service")

const { 
    S3_BUCKET_TEMP,
    S3_BUCKET_PRIVATE, 
} = process.env

const {
    toJsonObj,
} = require("../utils/dataTransformHelper")
const {
    toCmdUpdate,
    combileExcuteParams,
} = require("../utils/sqlGenerator")

const toObj = rawData => Object
    .keys(rawData)
    .reduce((obj, key) => {
        if (['request_data'].includes(key)) {
            obj = { ...obj, [key]: toJsonObj(rawData[key]) }
        } else {
            obj = { ...obj, [key]: rawData[key] }
        }
        return obj
    }, {})

const genConditionsGetList = options => {
    const {
        country_code,
        approval_status,
        approval_reject_type,
        keywords = [],
        keywords_not = [],
        listOfId = [],
    } = options || {}

    let conditions = []
    let values = []

    // request_data
    conditions.push(`p.request_data IS NOT NULL`)

    // country_code
    if (country_code !== undefined) {
        conditions.push(`p.country_code=?`)
        values.push(country_code)
    }

    // keywords
    if (keywords.length > 0) {
        const searchFields = [
            "v.reference_id",
            "p.order_id",
            "v.ba_id",
            "v.government_id",
            "c.human_name",
            "c.human_native_name",
        ]

        const keywordsConditions = keywords
            .map(keyword => {
                const searchSql = searchFields
                    .map(field => `${field} LIKE '%${keyword}%'`)
                    .join(" OR ")
                return `(${searchSql})`
            })
        conditions.push(...keywordsConditions)
    }

    // keywords_not
    if (keywords_not.length > 0) {
        const keywordsNotConditions = keywords_not
            .map(keyword => {
                const searchSql = searchFields
                    .map(field => `${field} NOT LIKE '%${keyword}%'`)
                    .join(" AND ")
                return `(${searchSql})`
            })
        conditions.push(...keywordsNotConditions)
    }

    // approval_status
    if (approval_status !== undefined) {
        if (approval_status === "null") {
            conditions.push(`approval_status IS NULL`)
        } else {
            conditions.push(`approval_status=?`)
            values.push(approval_status)
        }
    }

    // approval_reject_type
    if (approval_reject_type !== undefined) {
        if (approval_reject_type === "null") {
            conditions.push(`approval_reject_type IS NULL`)
        } else {
            conditions.push(`approval_reject_type=?`)
            values.push(approval_reject_type)
        }
    }

    // listOfId
    if (listOfId.length > 0) {
        conditions.push(`v.id IN (${listOfId.map(() => `?`).join(",")})`)
        values.push(...listOfId)
    }

    return { conditions, values }
}

const getList = async options => {
    const dbCalls = new DbCalls()
    const {
        skip = 0,
        limit = 100,
    } = options || {}

    try {
        await dbCalls.connect()

        const columns = [
            "v.id",
            "v.reference_id",
            "v.ba_id",
            "v.payment_reference_id",
            "v.government_id",
            "v.mobile",
            "v.front_id_img",
            "v.selfie_id_img",
            "v.bank_choice",
            "v.bank_name",
            "v.bank_account_name",
            "v.bank_account_number",
            "v.bank_account_type",
            "v.bank_img",
            "v.approval_status",
            "v.approval_by",
            "v.approval_at",
            "v.approval_reject_type",
            "v.approval_reject_reason",
            "CONVERT_TZ(v.created_date, '+07:00','+00:00') AS created_date",
        ]

        let sql = [
            `SELECT ${columns.join(", ")}, p.country_code, p.order_id, c.human_name, c.human_native_name`,
            `FROM unishop_id_verification AS v`,
            `LEFT JOIN unishop_payment AS p ON v.payment_reference_id = p.reference_id`,
            `LEFT JOIN unishop_cart AS c ON c.reference_id = p.reference_id`,
        ]

        const { conditions, values } = genConditionsGetList(options)

        if (conditions.length > 0) sql.push(`WHERE ${conditions.join(" AND ")}`)

        sql.push(`ORDER BY v.created_date DESC`)
        sql.push(`LIMIT ${skip}, ${limit}`)
        sql.push(`;`)

        const dt = await dbCalls.excuteQuery({ sql: sql.join(" "), values })
        return dt.map(toObj)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getCount = async options => {
    const dbCalls = new DbCalls()

    try {
        await dbCalls.connect()

        let sql = [
            `SELECT COUNT(*) AS total`,
            `FROM unishop_id_verification AS v`,
            `LEFT JOIN unishop_payment AS p ON v.payment_reference_id = p.reference_id`,
            `LEFT JOIN unishop_cart AS c ON c.reference_id = p.reference_id`,
        ]

        const { conditions, values } = genConditionsGetList(options)

        if (conditions.length > 0) sql.push(`WHERE ${conditions.join(" AND ")}`)

        sql.push(`;`)

        const [firstRow] = await dbCalls.excuteQuery({ sql: sql.join(" "), values })
        const { total } = firstRow || {}
        return total
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

        const excuteParams = editDataList
            .map(({ id, ...updateData }) => toCmdUpdate('unishop_id_verification', { id }, updateData))
            .reduce(combileExcuteParams, null)

        return dbCalls.excuteQuery(excuteParams)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getTempImages = async country_code => {
    const prefix = `${country_code}/ID/`
    const tempImages = await S3Service.getFileListAll({ 
        Bucket: S3_BUCKET_TEMP, 
        Prefix: prefix, 
    })

    return tempImages
        .map(r => r.Key.replace(new RegExp(`^${prefix}`), ''))
}

const moveToPrivateImages = async ({ country_code, list }) => {
    const processParams = list.map(r => {
        const originKey = `${country_code}/ID/${r.fileName}`
        const renameKey = r.rename ? `${country_code}/ID/${r.rename}` : null

        return {
            fromBucket: S3_BUCKET_TEMP,
            toBucket: S3_BUCKET_PRIVATE,
            key: originKey,
            ...(renameKey ? { renameKey } : {}),
        }
    })

    const processRequests = processParams.map(param => S3Service.moveFile(param))
    const processResults = await Promise.allSettled(processRequests)    
    return processResults
}


module.exports = {
    getList,
    getCount,
    editMultiple,
    getTempImages,
    moveToPrivateImages,
}