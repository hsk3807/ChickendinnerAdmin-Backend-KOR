
const DbCalls = require('../utils/DbCalls')


module.exports.getSortList = async (countryCode, queryStringFilter) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT DISTINCT ` +
            ` p1.country_code, ` +
            ` p1.warehouse, ` +
            ` p1.category_name_1, ` +
            ` p2.category_name_2,` +
            ` p1.category_sorted ` +
            ` FROM unishop_products AS p1 ` +
            ` LEFT OUTER JOIN (` +
            `	 SELECT ` +
            `		country_code, ` +
            `		warehouse, ` +
            ` 		category_name_1,` +
            ` 		MAX(category_name_2) AS category_name_2` +
            ` 	FROM unishop_products AS p2` +
            ` 	WHERE category_name_2<>""` +
            ` 	GROUP BY country_code ASC, warehouse ASC, category_name_1 ASC` +
            ` ) AS p2 ON p1.country_code=p2.country_code AND p1.warehouse=p2.warehouse AND p1.category_name_1=p2.category_name_1` +
            ` WHERE p1.country_code=?` +
            ` AND p1.category_name_1 <> ""`

        const extendConditions = []
        const { warehouse } = queryStringFilter || {}
        if (warehouse && Array.isArray(warehouse) && warehouse.length > 0) {
            const conditionsString = warehouse.map(w => `'${w}'`)
            extendConditions.push(`p1.warehouse IN (${conditionsString})`)
        }

        if (extendConditions.length > 0) {
            sql += ` AND ${extendConditions.join(" AND ")}`
        }

        sql += ` ORDER BY ` +
            ` p1.category_sorted ASC`

        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })

        return result
    } catch (err) {
        console.error(err)
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getList = async (countryCode, queryStringFilter) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT DISTINCT p.category_name_1` +
            ` FROM unishop_products AS p` +
            ` WHERE p.country_code=?` +
            ` AND p.category_name_1 <> ""`

        const extendConditions = []
        const { warehouse } = queryStringFilter || {}
        if (warehouse && Array.isArray(warehouse) && warehouse.length > 0) {
            const conditionsString = warehouse.map(w => `'${w}'`)
            extendConditions.push(`warehouse IN (${conditionsString})`)
        }

        if (extendConditions.length > 0) {
            sql += ` AND ${extendConditions.join(" AND ")}`
        }

        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })

        return result.map(r => r.category_name_1)
    } catch (err) {
        console.error(err)
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getLastCategorySortedByWarehouse = async (countryCode, warehouse) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT DISTINCT p.category_sorted ` +
            ` FROM unishop_products AS p ` +
            ` WHERE p.country_code=?` +
            ` AND CONCAT('',p.category_sorted * 1)=p.category_sorted` +
            ` AND p.warehouse=?` +
            ` ORDER BY p.category_sorted DESC, p.sorted DESC` +
            ` LIMIT 1;`

        const values = [countryCode, warehouse]
        const result = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = result || []
        const { category_sorted } = firstRow || {}
        return parseInt(category_sorted)
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
                category_sorted,
                country_code,
                warehouse,
                category_name_1
            } = r

            cmd += `UPDATE unishop_products` +
                ` SET category_sorted='${category_sorted}'` +
                ` WHERE country_code='${country_code}'` +
                ` AND warehouse='${warehouse}'` +
                ` AND category_name_1='${category_name_1}'` +
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