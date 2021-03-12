const DbCalls = require('../utils/DbCalls')

const countrySelect = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT VALUE FROM unishop_key_value WHERE id=5`
        let data = await dbCalls.excuteQuery(sql)
        return JSON.parse(data[0]['VALUE'])
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}
const countrySelectExpress = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT VALUE FROM unishop_key_value WHERE id=6`
        let data = await dbCalls.excuteQuery(sql)
        return JSON.parse(data[0]['VALUE'])
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}
const backgroundImageCountrySelect = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT url FROM unishop_files_2 WHERE id=1 or id=2 or id=3 or id=4 or id=5`
        let data = await dbCalls.excuteQuery({ sql })
        return JSON.stringify(data)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const backgroundImageCountrySelectExpress = async () => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `SELECT url FROM unishop_files_2 WHERE id=7 or id=8 or id=9 or id=10 or id=11`
        let data = await dbCalls.excuteQuery({ sql })
        return JSON.stringify(data)
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const upDateCountry = async (data) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `UPDATE unishop_key_value SET value=? WHERE id=?`
        const values = [data, 5]
        await dbCalls.excuteQuery({ sql, values })
        return true
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const upDateCountryExpress = async (data) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()
        let sql = `UPDATE unishop_key_value SET value=? WHERE id=?`
        const values = [data, 6]
        await dbCalls.excuteQuery({ sql, values })
        return true
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateBgImage = async (bg, icon, logo, title) => {
    const dbCalls = new DbCalls()
    const bg_desktop = bg.desktop
    const bg_mobile = bg.mobile
    const icon_ = icon
    const logo_ = logo
    const title_ = title

    try {
        await dbCalls.connect()
        let sql = `UPDATE unishop_files_2 SET url=? WHERE id=?`
        let values = [bg_desktop, 1]
        await dbCalls.excuteQuery({ sql, values })
        values = [bg_mobile, 2]
        await dbCalls.excuteQuery({ sql, values })
        values = [icon_, 3]
        await dbCalls.excuteQuery({ sql, values })
        values = [logo_, 4]
        await dbCalls.excuteQuery({ sql, values })
        values = [title_, 5]
        await dbCalls.excuteQuery({ sql, values })
        // await dbCalls.excuteQuery({ sql, values2 })
        return true
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const updateBgImageExpress = async (bg, icon, logo, title) => {
    const dbCalls = new DbCalls()
    const bg_desktop = bg.desktop
    const bg_mobile = bg.mobile
    const icon_ = icon
    const logo_ = logo
    const title_ = title

    try {
        await dbCalls.connect()
        let sql = `UPDATE unishop_files_2 SET url=? WHERE id=?`
        let values = [bg_desktop, 7]
        await dbCalls.excuteQuery({ sql, values })
        values = [bg_mobile, 8]
        await dbCalls.excuteQuery({ sql, values })
        values = [icon_, 9]
        await dbCalls.excuteQuery({ sql, values })
        values = [logo_, 10]
        await dbCalls.excuteQuery({ sql, values })
        values = [title_, 11]
        await dbCalls.excuteQuery({ sql, values })
        // await dbCalls.excuteQuery({ sql, values2 })
        return true
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    countrySelect,
    upDateCountry,
    updateBgImage,
    updateBgImageExpress,
    backgroundImageCountrySelect,
    countrySelectExpress,
    upDateCountryExpress,
    backgroundImageCountrySelectExpress
}




