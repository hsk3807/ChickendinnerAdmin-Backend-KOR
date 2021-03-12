
const DbCalls = require('../utils/DbCalls')

const COLUMNS_LISTITEM = [
    'id',
    'createdAt',
    'createdBy',
    'updatedAt',
    'updatedBy',
    'channel',
    'ref',
    'title_english',
    'title_native'
]

const COLUMNS_DETAIL = [
    ...COLUMNS_LISTITEM,
    'content_english',
    'content_native',
]

const getList = async options => {
    const {
        createdAtBegin = null,
        createdAtEnd = null,
        updatedAtBegin = null,
        updatedAtEnd = null,
        channel = null,
        keyword = null,
        skip,
        limit,
    } = options || {}
   
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = []
        const values = []
        const filterList = []

        sql.push(`SELECT ${COLUMNS_LISTITEM.join(",")} FROM unishop_blog_posts`)
        
        if (createdAtBegin) {
            filterList.push(`createdAt >= ?`)
            values.push(createdAtBegin)
        }

        if (createdAtEnd) {
            filterList.push(`createdAt <= ?`)
            values.push(createdAtEnd)
        }

        if (updatedAtBegin) {
            filterList.push(`updatedAt >= ?`)
            values.push(updatedAtBegin)
        }

        if (updatedAtEnd) {
            filterList.push(`updatedAt <= ?`)
            values.push(updatedAtEnd)
        }

        if (channel) {
            filterList.push(`channel = ?`)
            values.push(channel)
        }

        if (keyword){
            const searchColumns = [`title_english`, `title_native`, `content_english`, `content_native`]
            filterList.push(`(${searchColumns.map(c => `${c} LIKE ?`).join(" OR ")})`)
            values.push(...searchColumns.map(()=>`%${keyword}%`))
        }
        
        if (filterList.length > 0) sql.push(`WHERE ${filterList.join(" AND ")}`)

        sql.push(`LIMIT ${skip}, ${limit}`)

        return dbCalls.excuteQuery({ 
            sql: `${sql.join(" ")};`, 
            values 
        })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const create = async createData => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const columns = Object.keys(createData)
        const cmdParams = Object.keys(createData).map(() => `?`)
        
        const sql  = `INSERT INTO unishop_blog_posts (${columns.join(",")}) VALUES (${cmdParams.join(",")});`
        const values = Object.keys(createData).map(col => createData[col])

        return dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const getById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `SELECT ${COLUMNS_DETAIL.join(",")} FROM unishop_blog_posts WHERE id=?`
        const values = [id]

        const [first] = await dbCalls.excuteQuery({ sql, values })
        return first
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const deleteById = async id => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        const sql = `DELETE FROM unishop_blog_posts WHERE id=?`
        const values = [id]

        return dbCalls.excuteQuery({ sql, values })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

const update = async (id, updateData) => {
    const dbCalls = new DbCalls()
    try {
        await dbCalls.connect()

        let sql = []
        let values = []
        
        sql.push(`UPDATE unishop_blog_posts SET`)
        
        const updateColumns = Object.keys(updateData).map(col => `${col}=?`)
        values = [...values, ...Object.keys(updateData).map(col => updateData[col])]

        sql.push(updateColumns.join(", "))

        sql.push(`WHERE id=?`)
        values = [...values, id]

        console.log({sql, values})

        return dbCalls.excuteQuery({ 
            sql: `${sql.join(" ")};`, 
            values 
        })
    } catch (err) {
        console.error(err)
        throw err
    } finally {
        if (dbCalls) await dbCalls.disconnect()
    }
}

module.exports = {
    getList,
    create,
    getById,
    deleteById,
    update,
}