const DbCalls = require('../utils/DbCalls')
const {
    toJsonArray,
    toStringArray,
    toGroupObjValue,
    toGroupObjArray,
    toGroupObjBool,
    extractGroupBool,
    extractGroupValue,
    extractGroupArray,
} = require("../utils/dataTransformHelper")
const {
    toCmdInsert,
    toCmdUpdate,
    toCmdDelete,
    combileExcuteParams,
} = require("../utils/sqlGenerator")

const columnsList = [
    `p.id`,
    `p.country_code`,
    `p.item_code`,
    `p.created_at`,
    `p.created_by`,
    `p.updated_at`,
    `p.updated_by`,
    `p.is_archive`,
    `p.is_service_item`,
    `p.is_liquefy`,
    `p.is_renewal`,
    `p.is_renewal_sellable`,
    `p.is_starter_kit`,
    `p.is_starter_kit_sellable`,
    `p.allow_unipower`,
    `p.allow_shop`,
    `p.allow_enroll`,
    `p.allow_cs`,
    `p.allow_as`,
    `p.only_status_list`,
    `p.product_sorting`,
    `p.item_name_english`,
    `p.item_name_native`,
    `p.item_info_list_english`,
    `p.item_info_list_native`,
    `p.price_wholesale`,
    `p.price_retail`,
    `p.price_preferred`,
    `p.price_employee`,
    `p.pv`,
    `p.image_url`,
    `p.remarks`,
    `m.down_category_id`,
    `m.category_id`,
    `p.item_link`,
    `p.delay_phrase`,
    `p.is_pack`,
    `p.is_new`,
    `p.is_best`,
    `p.is_delay_chk`,
    `p.is_soldout`,
    `p.item_desc`,
    `p.max_order_cnt`,
    `i.qty_available`,
]

const queryDefault = [
    `SELECT `,
    columnsList.join(","),
    `, GROUP_CONCAT(DISTINCT m.category_id SEPARATOR '|') AS list_of_category_id`,
    `, GROUP_CONCAT(DISTINCT t.tag_id SEPARATOR '|') AS list_of_tag_id`,
    `, GROUP_CONCAT(DISTINCT i.id SEPARATOR '|') AS list_of_inventory_id`,
    `FROM products AS p`,
    `LEFT OUTER JOIN products_mapping_categories AS m ON m.product_id=p.id`,
    `LEFT OUTER JOIN products_mapping_tags AS t ON t.product_id=p.id`,
    `LEFT OUTER JOIN products_inventory AS i ON i.product_id=p.id`
]

const queryGroupBy = [
    `GROUP BY`,
    columnsList.join(","),
]

const listOfColumnBool = [
    `is_archive`,
    `is_service_item`,
    `is_liquefy`,
    `is_renewal`,
    `is_renewal_sellable`,
    `is_starter_kit`,
    `is_starter_kit_sellable`,
    `is_pack`,
    `is_new`,
    `is_best`,
    `is_delay_chk`,
    `is_soldout`
]
const listOfColumnArray = [`only_status_list`]
const listOfColumnJoin = [`list_of_category_id`, `list_of_tag_id`, `list_of_inventory_id`]
const rowDelColumn = [`list_of_category_id`, `list_of_tag_id`, `list_of_inventory_id`, `down_category_id`, `category_id`]

const toObj = rawData => Object
    .keys(rawData)
    .reduce((obj, key) => {
        if (/^allow_/.test(key)) {
            obj = toGroupObjBool(obj, "allow", key, rawData)
        } else if (/^item_name_/.test(key)) {
            obj = toGroupObjValue(obj, "item_name", key, rawData)
        } else if (/^price_/.test(key)) {
            obj = toGroupObjValue(obj, "price", key, rawData)
        } else if (/^qty_/.test(key)) {
            obj = toGroupObjValue(obj, "qty", key, rawData)
        } else if (/^item_info_list_/.test(key)) {
            obj = toGroupObjArray(obj, "item_info_list", key, rawData)
        } else if (listOfColumnArray.includes(key)) {
            obj = { ...obj, [key]: toJsonArray(rawData[key]) }
        } else if (listOfColumnBool.includes(key)) {
            obj = { ...obj, [key]: !!rawData[key] }
        } else if (listOfColumnJoin.includes(key)) {
            obj = { ...obj, [key]: !!rawData[key] ? rawData[key].split("|").map(id => parseInt(id)) : [] }
        } else {
            obj = { ...obj, [key]: rawData[key] }
        }
        return obj
    }, {})

const toRaw = objData => Object
    .keys(objData)
    .reduce((obj, key) => {
        if (listOfColumnBool.includes(key)) {
            obj = { ...obj, [key]: objData[key] ? 1 : 0 }
        } else if (/^allow/.test(key)) {
            obj = extractGroupBool(obj, key, objData)
        } else if ([`item_name`, `price`, `qty`].includes(key)) {
            obj = extractGroupValue(obj, key, objData)
        } else if ([`item_info_list`].includes(key)) {
            obj = extractGroupArray(obj, key, objData)
        } else if ([`only_status_list`].includes(key)) {
            obj = { ...obj, [key]: toStringArray(objData[key]) }
        } else if (rowDelColumn.includes(key)) {
            // do nothing
        } else {
            obj = { ...obj, [key]: objData[key] }
        }
        return obj
    }, {})

const getById = async id => {
    try {
        const [firstRow] = await getList({ listOfId:[id] })
        return firstRow
    } catch (err) {
        console.error(err)
        throw err
    }
}

const getList = async ({
    country_code,
    is_archive,
    allow_unipower,
    allow_shop,
    allow_enroll,
    allow_cs,
    allow_as,
    listOfId = [],
    listOfItemCode = [],
    skip = 0,
    limit = 50,
}) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let sql = [...queryDefault]
        let values = []
        let conditions = []

        if (country_code !== undefined) {
            conditions.push(`p.country_code=?`)
            values.push(country_code)
        }

        if (is_archive !== undefined) {
            conditions.push(`p.is_archive=?`)
            values.push(is_archive ? 1 : 0)
        }

        if (allow_unipower !== undefined) {
            conditions.push(`p.allow_unipower=?`)
            values.push(allow_unipower ? 1 : 0)
        }

        if (allow_shop !== undefined) {
            conditions.push(`p.allow_shop=?`)
            values.push(allow_shop ? 1 : 0)
        }

        if (allow_enroll !== undefined) {
            conditions.push(`p.allow_enroll=?`)
            values.push(allow_enroll ? 1 : 0)
        }

        if (allow_cs !== undefined) {
            conditions.push(`p.allow_cs=?`)
            values.push(allow_cs ? 1 : 0)
        }

        if (allow_as !== undefined) {
            conditions.push(`p.allow_as=?`)
            values.push(allow_as ? 1 : 0)
        }

        if (listOfId.length > 0){
            conditions.push(`p.id IN (${listOfId.map(_ => '?').join(",")})`)
            values.push(...listOfId)
        }

        if (listOfItemCode.length > 0){
            conditions.push(`p.item_code IN (${listOfItemCode.map(_ => '?').join(",")})`)
            values.push(...listOfItemCode)
        }

        if (conditions.length > 0) sql.push(` WHERE ${conditions.join(" AND ")}`)

        sql.push(...queryGroupBy)
        sql.push(`LIMIT ${skip}, ${limit}`)

        console.log(sql.join(" "), values)

        const dt = await dbCalls.excuteQuery({ sql: sql.join(" "), values })
        return dt.map(toObj)
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

        const {
            country_code,
            list_of_category_id = [],
            list_of_tag_id = [],
            down_category_id
        } = objData

        const rowData = toRaw(objData)
        const productExcuteParams = toCmdInsert(`products`, rowData)

        const insertResult = await dbCalls.excuteQuery(productExcuteParams)
        const { insertId: product_id } = insertResult

        const categoriesExcuteParams = list_of_category_id.length > 0
            ? list_of_category_id
                .map(category_id => ({ country_code, product_id, category_id, down_category_id }))
                .map(r => toCmdInsert('products_mapping_categories', r))
                .reduce(combileExcuteParams, null)
            : null

        const tagsExcuteParams = list_of_tag_id.length > 0
            ? list_of_tag_id
                .map(tag_id => ({ product_id, tag_id }))
                .map(r => toCmdInsert('products_mapping_tags', r))
                .reduce(combileExcuteParams, null)
            : null

        await Promise.all([
            ...(categoriesExcuteParams ? [dbCalls.excuteQuery(categoriesExcuteParams)] : []),
            ...(tagsExcuteParams ? [dbCalls.excuteQuery(tagsExcuteParams)] : []),
        ])

        return insertResult
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

        // delete categories if exists
        const deleteMappingCategories = editDataList.reduce((list, r) => {
            const {
                id: product_id,
                country_code,
                list_of_category_id
            } = r
            return list_of_category_id
                ? [...list, { product_id, country_code }]
                : list
        }, [])
        // delete tags if exists
        const deleteMappingTags = editDataList.reduce((list, r) => {
            const {
                id: product_id,
                list_of_tag_id,
            } = r
            return list_of_tag_id
                ? [...list, { product_id }]
                : list
        }, [])

        // add new categories
        const editMappingCategories = editDataList.reduce((list, r) => {
            const {
                id: product_id,
                country_code,
                list_of_category_id = [],
                down_category_id
            } = r
            return [
                ...list,
                ...list_of_category_id.map(category_id => ({ country_code, product_id, category_id, down_category_id }))
            ]
        }, [])
        // add new tags  
        const editMappingTags = editDataList.reduce((list, r) => {
            const {
                id: product_id,
                list_of_tag_id = [],
            } = r
            return [
                ...list,
                ...list_of_tag_id.map(tag_id => ({ product_id, tag_id }))
            ]
        }, [])

        // Excute Delete
        const deleteMappingCategoriesExcuteParams = deleteMappingCategories
            .map(r => toCmdDelete(`products_mapping_categories`, r))
            .reduce(combileExcuteParams, null)
        const deleteMappingTagsExcuteParams = deleteMappingTags
            .map(r => toCmdDelete(`products_mapping_tags`, r))
            .reduce(combileExcuteParams, null)
        const deleteExcuteProcess = []
        if (deleteMappingCategoriesExcuteParams) deleteExcuteProcess.push(dbCalls.excuteQuery(deleteMappingCategoriesExcuteParams))
        if (deleteMappingTagsExcuteParams) deleteExcuteProcess.push(dbCalls.excuteQuery(deleteMappingTagsExcuteParams))
        await Promise.all(deleteExcuteProcess)

        // Excute Edit
        const productsExcuteParams = editProducts
            .map(({ country_code, id, ...updateData }) => toCmdUpdate('products', { id, country_code }, updateData))
            .reduce(combileExcuteParams, null)
        const mappingCategoriesExcuteParams = editMappingCategories
            .map(r => toCmdInsert('products_mapping_categories', r))
            .reduce(combileExcuteParams, null)
        const mappingTagsExcuteParams = editMappingTags
            .map(r => toCmdInsert('products_mapping_tags', r))
            .reduce(combileExcuteParams, null)
        const excuteProcess = []
        if (productsExcuteParams) excuteProcess.push(dbCalls.excuteQuery(productsExcuteParams))
        if (mappingCategoriesExcuteParams) excuteProcess.push(dbCalls.excuteQuery(mappingCategoriesExcuteParams))
        if (mappingTagsExcuteParams) excuteProcess.push(dbCalls.excuteQuery(mappingTagsExcuteParams))

        return Promise.all(excuteProcess)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const remove = async objData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const {
            id: product_id,
            country_code,
            list_of_category_id = [],
            list_of_tag_id = [],
        } = objData

        const productExcuteParams = toCmdDelete(`products`, { id: product_id })
        const categoriesExcuteParams = list_of_category_id
            .map(category_id => ({ country_code, product_id, category_id }))
            .map(r => toCmdDelete('products_mapping_categories', r))
            .reduce(combileExcuteParams, null)
        const tagsExcuteParams = list_of_tag_id
            .map(tag_id => ({ product_id, tag_id }))
            .map(r => toCmdDelete('products_mapping_tags', r))
            .reduce(combileExcuteParams, null)

        return Promise.all([
            dbCalls.excuteQuery(productExcuteParams),
            ...(categoriesExcuteParams ? [dbCalls.excuteQuery(categoriesExcuteParams)] : []),
            ...(tagsExcuteParams ? [dbCalls.excuteQuery(tagsExcuteParams)] : []),
        ])
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getListPublish = async ({
    countryCode,
    allow,
    onlyEnable,
    inItemCode = [],
}) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let sql = [...queryDefault]
        let conditions = []
        let values = []

        const andConditions = {
            country_code: countryCode,
            is_archive: 0,
            ...(onlyEnable ? { is_enable: 1 } : {}),
            ...(allow ? { [`allow_${allow}`]: 1 } : {}),
        }
        const andConditionsList = Object.keys(andConditions).map(col => `p.${col}=?`)
        const andConditionsValues = Object.keys(andConditions).map(col => andConditions[col])
        if (andConditionsList.length > 0) {
            conditions.push(...andConditionsList)
            values.push(...andConditionsValues)
        }

        const inConditions = {
            ...(inItemCode.length > 0 ? { item_code: inItemCode } : {})
        }
        const inConditionsList = Object.keys(inConditions).map(col => `p.${col} IN (${inConditions[col].map(() => `?`).join(`,`)})`)
        const inConditionsValues = Object.keys(inConditions).reduce((list, col) => [...list, ...inConditions[col]], [])
        if (inConditionsList.length > 0) {
            conditions.push(...inConditionsList)
            values.push(...inConditionsValues)
        }

        conditions.push(`p.is_archive=?`)
        values.push(0)

        if (conditions.length > 0) sql.push(` WHERE ${conditions.join(" AND ")}`)

        sql.push(...queryGroupBy)

        const dt = await dbCalls.excuteQuery({ sql: sql.join(" "), values })
        return dt.map(toObj)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}


const getListOfCountry = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const sql = `SELECT DISTINCT country_code FROM products ORDER BY country_code ASC`;
        const res = await dbCalls.excuteQuery({ sql })
        return res.map(r => r.country_code)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getListOfItemCode = async countryCode => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const sql = `SELECT item_code FROM products WHERE country_code=? ORDER BY item_code ASC`;
        const values = [countryCode]
        const res = await dbCalls.excuteQuery({ sql, values })
        return res.map(r => r.item_code)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getRequestCounterList = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const sql = `SELECT * FROM products_request_counter;`
        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    getById,
    getList,
    create,
    editMultiple,
    remove,
    getListPublish,
    getListOfCountry,
    getListOfItemCode,
    getRequestCounterList,
}