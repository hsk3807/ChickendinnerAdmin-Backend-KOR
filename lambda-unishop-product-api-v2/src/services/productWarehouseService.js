const axios = require("axios")
const DbCalls = require('../utils/DbCalls')
const UpdateQtyParams = require("../configs/UpdateQtyParams")
const {
    toGroupObjValue,
} = require("../utils/dataTransformHelper")

const toObj = rawData => Object
    .keys(rawData)
    .reduce((obj, key) => {
        if (/^qty_/.test(key)) {
            obj = toGroupObjValue(obj, "qty", key, rawData)
        }
        else if ([
            'is_enable',
            'is_allow_backorder',
        ].includes(key)) {
            obj = { ...obj, [key]: !!rawData[key] }
        }
        else {
            obj = { ...obj, [key]: rawData[key] }
        }
        return obj
    }, {})

const countRequest = async (countryCode, defaultHit = 1) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const datafields = {
            country_code: countryCode,
            hit: defaultHit,
        }
        const fieldNames = Object.keys(datafields).map(col => col)
        const fieldParams = Object.keys(datafields).map(() => `?`)
        const filedValues = Object.keys(datafields).map(col => datafields[col])
        const sql = `INSERT INTO products_request_counter 
                (${fieldNames.join(",")}) 
            VALUES 
                (${fieldParams.join(",")}) 
            ON DUPLICATE KEY UPDATE 
                hit = hit + 1
            ;`

        const values = [...filedValues]
        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const saveRequestCounterUnuse = async countryCode => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `UPDATE products_request_counter SET
            updated_qty_second = CASE
                WHEN updated_qty_second = 60 THEN 120
                WHEN updated_qty_second = 120 THEN 240
                WHEN updated_qty_second = 240 THEN 480
                WHEN updated_qty_second = 480 THEN 960
                ELSE 960
            END
            WHERE country_code=?;`

        const values = [countryCode]
        const result = await dbCalls.excuteQuery({ sql, values })
        return {
            function: "saveRequestCounterUnuse",
            countryCode,
            result,
        }
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const saveRequestCounterUsed = async (countryCode, isStepDown = true) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        const datafields = {
            country_code: countryCode,
            hit: 0,
            updated_qty_at: new Date(),
            updated_qty_second: 960,
        }
        const fieldNames = Object.keys(datafields).map(col => col)
        const fieldParams = Object.keys(datafields).map(() => `?`)
        const filedValues = Object.keys(datafields).map(col => datafields[col])

        const sql = `INSERT INTO products_request_counter 
                (${fieldNames.join(",")}) 
            VALUES 
                (${fieldParams.join(",")}) 
            ON DUPLICATE KEY UPDATE
                hit = 0,
                updated_qty_at = ?
                ${isStepDown
                ? `,updated_qty_second = CASE
                    WHEN updated_qty_second IS NULL THEN 960
                    WHEN updated_qty_second = 960 THEN 480
                    WHEN updated_qty_second = 480 THEN 240
                    WHEN updated_qty_second = 240 THEN 120
                    WHEN updated_qty_second = 120 THEN 60
                    WHEN updated_qty_second = 60 THEN 60
                    ELSE NULL
                END`: ``};`

        const values = [...filedValues, new Date()]
        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getInventoryIndentity = async (countryCode, warehouseName) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const sql = [
            "SELECT",
            "i.warehouse_id,",
            "i.product_id,",
            "p.item_code",
            "FROM `products_inventory` AS i",
            "LEFT JOIN `products`AS p ON p.id = i.product_id",
            "LEFT JOIN `products_warehouses` AS w ON w.id = i.warehouse_id",
            "WHERE",
            "w.country_code=? AND w.warehouse_name=?",
            ";",
        ]
        const values = [countryCode, warehouseName]
        const res = await dbCalls.excuteQuery({ sql: sql.join(" "), values })
        return res
    }catch(err){
        console.error(err)
        throw { countryCode, message: err.message }
    }finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getOrderTermsHydra = async ({
    market,
    country,
    shippingMethodType,
    shippingMethodLocation,
    listOfItemCode = [],
}) => {
    const url = `https://hydra.unicity.net/v5a/orderTerms?expand=item`
    const data = {
        order: {
            customer: {
                href: `https://hydra.unicity.net/v5a/customers?type=Associate`
            },
            market,
            shipToAddress: {
                country,
            },
            ...(shippingMethodType
                ? {
                    shippingMethod: {
                        href: `https://hydra.unicity.net/v5a/shippingmethods?type=${shippingMethodType}${shippingMethodLocation ? `&location=${shippingMethodLocation}` : ``}`
                    }
                } : {})
        },
        vary: {
            lines: {
                items: [
                    {
                        item: {
                            href: `https://hydra.unicity.net/v5a/items?id.unicity=${listOfItemCode.join("|")}`
                        },
                        quantity: `?`
                    }
                ]
            }
        }
    }
    const res = await axios({
        method: `post`,
        url,
        data,
    })

    return res
}

const updateQty = async updateItems => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = updateItems
            .map(() => [
                `UPDATE products_inventory SET`,
                `updated_qty_at=?,`, 
                `qty_available=?`,
                `WHERE warehouse_id=? AND product_id=?`
            ].join(" "))
            .join(";")

        const values = updateItems
            .reduce((list, r) => [
                ...list,
                new Date(),
                r.qty_available,
                r.warehouse_id,
                r.product_id
            ], [])

        return await dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

// get hydra qty + update into inventory
const getQtyFromByhydra = async (countryCode, params, itemList) => {
    try{
        const { data = {}} = await getOrderTermsHydra({ 
            ...params, 
            listOfItemCode: itemList.map(r => r.item_code.trim()) 
        })
        
        const hydraItems = (data.items || [])
            .filter(r => Array.isArray(r.lines) && r.lines.length > 0)
            .map(r => r.lines[0])
            .map(r => ({
                item_code: r.item.id.unicity,
                qty_available: r.quantityDetails.quantityAvailable,
            }))

        const updateItems = itemList.map(r => {
            const foundItem = hydraItems.find(h => h.item_code === r.item_code)
            const { qty_available = 0 } = foundItem || {}
            return {
                ...r,
                qty_available,
            }
        }, [])

        return {
            function: 'getQtyFromByhydra',
            countryCode,
            updateItems,
            ...params,
        }
    }catch(err){
        console.error(err)
        throw { countryCode, message: err.message, ...params }
    }
}

const updateInventory = async (countryCode, isStepDown = true) => {
    try {
        const configParams = UpdateQtyParams.filter(r => r.countryCode === countryCode)
        if (configParams.length < 1) throw { message: `updateInventory: "${countryCode}" Missing configs parameters.` }

        const limitItems = 15
        const getHydraProcess = configParams
            .map(async params => {
                const { countryCode, warehouse } = params 
                const inventoryKeys = await getInventoryIndentity(countryCode, warehouse)

                // split Items for api limit items
                const separateKeysList = inventoryKeys
                    .reduce((list, r) => {
                        if (list.length > 0 && list[list.length - 1].length < limitItems) {
                            list[list.length - 1] = [...list[list.length - 1], r]
                        } else {
                            list.push([r])
                        }
                        return list
                    }, [])
                
                const getQtyProcess = separateKeysList.map(list => getQtyFromByhydra(countryCode, params, list))
                const getQtyResults = await Promise.allSettled(getQtyProcess)

                return { warehouse, getQtyResults }
            })

        const getHydraResults = await Promise.allSettled(getHydraProcess)
        const mergedUpdateItems = getHydraResults
            .filter(r => r.status === "fulfilled")
            .map(r => r.value.getQtyResults)
            .reduce((list, qtyResults) => [...list, ...qtyResults], [])
            .filter(r => r.status === "fulfilled")
            .map(r => r.value.updateItems)
            .reduce((list, updateItems) => [...list, ...updateItems], [])
            .reduce((list, r) => {
                const foundIndex = list.findIndex(l => l.warehouse_id === r.warehouse_id && l.product_id === r.product_id)
                const isExists = foundIndex > -1
                if (isExists){
                    const totalQty = list[foundIndex].qty_available + r.qty_available
                    list[foundIndex].qty_available =  totalQty > 99 ? 99 : totalQty
                }else{
                    list.push(r)
                }
                return list
            }, [])
           
        const updateResults = await updateQty(mergedUpdateItems)
        const updateResultsWithStatus = mergedUpdateItems
            .map((r, index) => ({
                ...r, 
                isUpdated: !!updateResults[index].changedRows,
            }))

        await saveRequestCounterUsed(countryCode, isStepDown)
        return {
            function: "updateInventory",
            countryCode,
            result: updateResultsWithStatus, 
        }
    }catch(err){
        console.error(err)
        throw { countryCode, message: err ? err.message : 'no error message' }
    }
}

const getInventoryList = async ({
    listOfId = [],
    country_code,
}) => {
    const dbCalls = new DbCalls()
    try{
        await dbCalls.connect()

        const sql = [
            `SELECT`,
            `i.id,`,
            `i.is_enable,`,
            `i.is_allow_backorder,`,
            `i.updated_qty_at,`,
            `i.qty_available,`,
            `i.qty_buffer,`,
            `w.country_code,`,
            `i.warehouse_id,`,
            `w.warehouse_name,`,
            `w.warehouse_type`,
            `FROM products_inventory AS i`,
            `LEFT JOIN products_warehouses AS w ON w.id=i.warehouse_id`
        ]
        const values = []
        const conditions = []

        if (listOfId.length > 0){
            conditions.push(`i.id IN (${listOfId.map(_ => `?`).join(',')})`)
            values.push(...listOfId)
        }

        if (country_code){
            conditions.push(`w.country_code = ?`)
            values.push(country_code)
        }

        if (conditions.length > 0){
            sql.push(`WHERE ${conditions.join(" AND ")}`)
        }

        const dt = await dbCalls.excuteQuery({ sql: sql.join(" "), values })
        return dt.map(toObj)
    }catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getList = async ({
    country_code,
}) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let sql = [`SELECT * FROM products_warehouses`]
        let conditions = []
        let values = []

        if (country_code) {
            conditions.push(`country_code=?`)
            values.push(country_code)
        }

        if (conditions.length > 0) sql.push(`WHERE ${conditions.join(" AND ")}`)

        const dt = await dbCalls.excuteQuery({ sql: sql.join(" "), values })

        return dt
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    countRequest,
    saveRequestCounterUnuse,
    saveRequestCounterUsed,
    updateInventory,
    getInventoryList,
    getList,
}