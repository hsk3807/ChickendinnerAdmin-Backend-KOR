
const DbCalls = require('../utils/DbCalls')

const genExtendConditions = (columnName, filters) => {
    let extendConditions
    if (filters && filters.length > 0) {
        const conditionsString = filters.map(value => `'${value}'`)
        extendConditions = `${columnName} IN (${conditionsString})`
    }
    return extendConditions
}

const getColumnsData = prefix => {
    const cols = [
        'country_code',
        'item_code',
        'warehouse',
        'item_name_1',
        'item_name_2',
        'item_desc_1',
        'item_desc_2',
        'category_sorted',
        'sorted',
        'category_name_1',
        'category_name_2',
        'wholesale_price',
        'retail_price',
        'preferred_price',
        'employee_price',
        'pv',
        'qty',
        'qty_purchased',
        'qty_limited',
        'allow_backorder',
        'hot',
        'item_feature_1',
        'item_feature_2',
        'image_url',
        'hd_image_url',
        'video_url',
        'link',
        'link2',
        'link_list',
        'link_list2',
        'status',
        'remarks',
        'id',
        'updated_on',
        'updated_by',
        'buffer_qty',
        'featured',
        'nutrition',
    ]

    return cols.map(c=>`${prefix ? `${prefix}.${c}` : `${c}` }`).join(', ')
}

const transformData = r => ({
    ...r,
    link_list: JSON.parse(r.link_list || "[]"),
    link_list2: JSON.parse(r.link_list2 || "[]"),
})

module.exports.getList = async (countryCode, queryStringFilter) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT` +
            ` ${getColumnsData("p")}` +
            ` FROM unishop_products AS p` +
            ` LEFT JOIN item_sales_rank AS sr ON (sr.country_code=p.country_code AND sr.item_code=p.item_code)` +
            ` WHERE p.country_code=?`

        const { warehouse, category_name_1 } = queryStringFilter || {}

        // Filter : warehouse
        const extendConditionsWarehouse = genExtendConditions('p.warehouse', warehouse)
        if (extendConditionsWarehouse) sql += ` AND ${extendConditionsWarehouse}`

        // Filter : category_name_1
        const extendConditionsCategory = genExtendConditions('p.category_name_1', category_name_1)
        if (extendConditionsCategory) sql += ` AND ${extendConditionsCategory}`

        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })

        return result.map(r => transformData(r)) 
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getListByItemCode = async (countryCode, options) => {
    const {listOfItemCode = []} = options
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let values = [];
        let sql = `SELECT` +
            ` ${getColumnsData("p")}` +
            ` FROM unishop_products AS p` +
            ` LEFT JOIN item_sales_rank AS sr ON (sr.country_code=p.country_code AND sr.item_code=p.item_code)` +
            ` WHERE p.country_code=?` +
            ` AND p.item_code IN (${listOfItemCode.map(() => `?`).join(",")})`
        values = [countryCode, ...listOfItemCode]

        const result = await dbCalls.excuteQuery({ sql, values })

        return result.map(r => transformData(r)) 
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getById = async (countryCode, id) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT ${getColumnsData()} FROM unishop_products` +
            ` WHERE country_code=?` +
            ` AND id=?`

        const values = [countryCode, id]
        const result = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = result
        return firstRow ? transformData(firstRow) : null
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getByItemCode = async (countryCode, warehouse, item_code) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT ${getColumnsData()} FROM unishop_products` +
            ` WHERE country_code=?` +
            ` AND warehouse=?` +
            ` AND item_code=?`

        const values = [countryCode, warehouse, item_code]
        const result = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = result
        return firstRow ? transformData(firstRow) : null
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.create = async newData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `INSERT INTO unishop_products (` +
            ` ${Object.keys(newData).map(col => col).join(',')}` +
            ` ) VALUES (` +
            ` ${Object.keys(newData).map(col => `'${newData[col]}'`).join(',')}` +
            ` );`

        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.update = async editData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const { id } = editData
        delete editData.id

        const sql = `UPDATE unishop_products SET` +
            ` ${Object.keys(editData).map(col => `${col}='${editData[col]}'`).join(',')}` +
            ` WHERE id=${id}`

        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.removeById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const sql = `DELETE FROM unishop_products WHERE id=${id}`
        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.search = async (countryCode, keywords, skip, limit) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const conditions = keywords.reduce((list, k) => {
            const fields = [
                `p.item_code LIKE '%${k}%'`,
                `p.warehouse LIKE '%${k}%'`,
                `p.item_name_1 LIKE '%${k}%'`,
                `p.item_name_2 LIKE '%${k}%'`,
                `p.item_desc_1 LIKE '%${k}%'`,
                `p.item_desc_2 LIKE '%${k}%'`,
                `p.remarks LIKE '%${k}%'`,
            ]
            list.push(`(${fields.join(' OR ')})`)
            return list
        }, [])

        const sql = `SELECT *  FROM unishop_products AS p` +
            ` WHERE p.country_code='${countryCode}'` +
            ` AND ${conditions.join(' AND ')}` +
            ` LIMIT ${skip}, ${limit}`

        const result = await dbCalls.excuteQuery({ sql })

        return result.map(r => transformData(r)) 
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.updateMultiple = async listOfEditData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const listOfSql = listOfEditData.map(r => {
            return `UPDATE unishop_products SET` +
                ` ${Object.keys(r).filter(col => col !== "id").map(col => `${col}='${r[col]}'`).join(',')}` +
                ` WHERE id=${r.id};`
        })

        const sql = listOfSql.join("")
        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getLastSortedByCategory = async (countryCode, warehouse, category) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT DISTINCT p.sorted ` +
            ` FROM unishop_products AS p ` +
            ` WHERE p.country_code=?` +
            ` AND p.warehouse=?` +
            ` AND p.category_name_1=?` +
            ` ORDER BY p.sorted DESC` +
            ` LIMIT 1;`

        const values = [countryCode, warehouse, category]
        const result = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = result || []
        const { sorted } = firstRow || {}
        return parseInt(sorted)
    } catch (err) {
        console.error(err)
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getSortListByWarehouse = async (countryCode, warehouse) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT ` +
            ` p.country_code,` +
            ` p.warehouse,` +
            ` p.item_code,` +
            ` p.sorted` +
            ` FROM unishop_products AS p` +
            ` WHERE p.country_code=?` +
            ` AND p.warehouse=?` +
            ` ORDER BY p.sorted ASC`

        const values = [countryCode, warehouse]
        const result = await dbCalls.excuteQuery({ sql, values })
        
        return result.map(r => transformData(r)) 
    } catch (err) {
        console.error(err)
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}


module.exports.updateSortList = async datasource => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = datasource.reduce((cmd, r) => {
            const {
                country_code,
                warehouse,
                item_code,
                sorted,
            } = r

            cmd += `UPDATE unishop_products` +
                ` SET sorted='${sorted}'` +
                ` WHERE country_code='${country_code}'` +
                ` AND warehouse='${warehouse}'` +
                ` AND item_code='${item_code}'` +
                `;`

            return cmd
        }, '')

        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.deleteMultiple = async listOfId => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const listOfSql = listOfId.map(id => `DELETE FROM unishop_products WHERE id=${id};`)
        const sql = listOfSql.join("")

        return await dbCalls.excuteQuery({ sql })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}