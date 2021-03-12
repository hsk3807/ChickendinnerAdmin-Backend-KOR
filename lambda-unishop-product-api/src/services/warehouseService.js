
const DbCalls = require('../utils/DbCalls')

const genExtendConditions = (columnName, filters) => {
    let extendConditions
    if (filters && filters.length > 0) {
        const conditionsString = filters.map(value => `'${value}'`)
        extendConditions = `${columnName} IN (${conditionsString})`
    }
    return extendConditions
}

module.exports.getNameList = async countryCode => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const sql = `SELECT DISTINCT p.warehouse` +
            ` FROM unishop_products AS p` +
            ` WHERE p.country_code=?` +
            ` AND p.warehouse <> ""`
        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })

        return result.map(r => r.warehouse)
    } catch (err) {
        console.error(err)
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getDataList = async queryStringFilter => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT DISTINCT` +
            ` p.country_code,` +
            ` p.warehouse` +
            ` FROM unishop_products AS p` +
            ` WHERE p.warehouse<>''`
        
        // Filter : warehouse
        const { country_code } = queryStringFilter || {}
        const extendConditionsCountry = genExtendConditions('p.country_code', country_code)
        if (extendConditionsCountry) sql += ` AND ${extendConditionsCountry}`

        // Order
        sql += ` ORDER BY ` +
            ` p.country_code ASC, ` +
            ` p.warehouse ASC`

        const result = await dbCalls.excuteQuery({ sql })

        return result
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports.getWarehouseGroupByProducts = async (countryCode, options) =>{
    const dbCalls = new DbCalls()
    try{
        const {
            listOfItemCode = []
        } = options || {}

        await dbCalls.connect()

        let values = [];
        let sql = `SELECT DISTINCT` +
            ` p.country_code,` +
            ` p.item_code,` +
            ` GROUP_CONCAT(p.warehouse) AS warehouses` +
            ` FROM unishop_products AS p` +
            ` WHERE p.warehouse <> ''`


        if (countryCode) sql += ` AND p.country_code = ?`
        values.push(countryCode)

        if (listOfItemCode.length > 0){
            sql += ` AND p.item_code IN (${listOfItemCode.map(()=>`?`).join(`,`)})`
            values = [...values, ...listOfItemCode]
        }

        sql += `GROUP BY country_code, item_code`

        console.log({sql, values})

        const result = await dbCalls.excuteQuery({ sql, values })

        return result.map(({country_code, item_code, warehouses}) => ({
            country_code,
            item_code,
            listOfWarehouse: warehouses.split(",")
        }))
    } catch(err){
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}
