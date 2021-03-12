
const DbCalls = require('../utils/DbCalls')

const getNext = async mockupType => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        // Get Data
        let sql = `SELECT id, data, usageCounter FROM mockup_adapter_api` +
            ` WHERE mockupType = '${mockupType}' ORDER BY usageCounter ASC;`
        const dt = await dbCalls.excuteQuery({ sql })
        const [firstRow] = dt || []
        const { id, data, usageCounter } = firstRow || {}

        // Increse usageCounter
        sql = `UPDATE mockup_adapter_api SET usageCounter=? WHERE id=?`
        const values = [usageCounter + 1, id]
        await dbCalls.excuteQuery({ sql, values })

        return JSON.parse(data)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getGenealogy = () => {
    try {
        return getNext('etl/genealogy')
    } catch (err) {
        console.error(err)
        throw err
    }
}
const getOnself = () => {
    try {
        return getNext('etl/onself')
    } catch (err) {
        console.error(err)
        throw err
    }
}
const getOrderHistory = () => {
    try {
        return getNext('etl/orderHistory')
    } catch (err) {
        console.error(err)
        throw err
    }
}
const getCommission = () => {
    try {
        return getNext('etl/commission')
    } catch (err) {
        console.error(err)
        throw err
    }
}



module.exports = {
    getGenealogy,
    getOnself,
    getOrderHistory,
    getCommission
}