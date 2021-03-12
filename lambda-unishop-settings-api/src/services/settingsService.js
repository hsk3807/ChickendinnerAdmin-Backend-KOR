const DbCalls = require('../utils/DbCalls')
const {
    toGroupObjArray,
    extractGroupArray,
} = require("../utils/dataTransformHelper")
const {
    toCmdUpdate,
} = require("../utils/sqlGenerator")

const toObj = rawData => Object
    .keys(rawData)
    .reduce((obj, key) => {
         if (/^login_/.test(key)) {
            obj = toGroupObjArray(obj, "login", key, rawData)
        } else {
            obj = { ...obj, [key]: rawData[key] }
        }
        return obj
    }, {})

const toRaw = objData => Object
    .keys(objData)
    .reduce((obj, key) => {
        if ([`login`].includes(key)) {
            obj = extractGroupArray(obj, key, objData)
        }  else {
            obj = { ...obj, [key]: objData[key] }
        }

        return obj
    }, {})

const getOne = async countryCode => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `SELECT * FROM unishop_settings WHERE countryCode=?;`
        const values = [countryCode]
        const dt = await dbCalls.excuteQuery({ sql, values })
        const [firstRow] = dt || []

        return toObj(firstRow)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const editOne = async editData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const { countryCode, ...updateData } = toRaw(editData)        
        const params = toCmdUpdate('unishop_settings', { countryCode }, updateData)

        return dbCalls.excuteQuery(params)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
} 

module.exports = {
    getOne,
    editOne,
}