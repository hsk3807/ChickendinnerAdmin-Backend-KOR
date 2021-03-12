const db = require('../utils/dbConnector');

module.exports.getFooterByCountryCodeAdmin = country_code => {
    return new Promise((resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        db.get(
            {
                TableName,
                Key: {
                    partition: 'items',
                    key: country_code
                }
            },
            (error, res) => {
                if (error) reject(error)
                if (res.Item) {
                    const {
                        footer,
                        key: country_code,
                        updateBy,
                        updateTime
                    } = res.Item

                    resolve({
                        footer,
                        country_code,
                        updateBy,
                        updateTime
                    })
                } else {
                    reject(new Error('Footer NotFound'))
                }
            })
    })
}

module.exports.getFooterByCountryCodeUser = country_code => {
    return new Promise((resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        db.get(
            {
                TableName,
                Key: {
                    partition: 'items',
                    key: country_code
                }
            },
            (error, res) => {
                if (error) reject(error)
                if (res.Item) {
                    let data_new = []
                    res.Item.footer.header_menu.forEach(element => {
                        if (element.isEnable) {
                            delete element.isEnable
                            data_new.push({
                                ...element
                            })
                        }
                    });
                    res.Item.footer.header_menu = data_new
                    
                    const {
                        footer,
                        key: country_code,
                        updateBy,
                        updateTime
                    } = res.Item

                    resolve({
                        footer,
                        country_code,
                        updateBy,
                        updateTime
                    })
                } else {
                    reject(new Error('Footer NotFound'))
                }
            })
    })
}

module.exports.getCountryCodeList = () => {
    return new Promise((resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        db.get(
            {
                TableName,
                Key: {
                    partition: 'list',
                    key: 'country_code'
                }
            },
            (error, res) => {
                if (error) reject(error)

                if (res.Item && res.Item.list) {
                    resolve(res.Item.list)
                } else {
                    reject(new Error('Country Code List NotFound'))
                }

            })
    })
}

module.exports.editFooterByCountryCode = (editFooter) => {
    return new Promise((resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        const { country_code } = editFooter
        const Item = { ...editFooter }

        Item.partition = 'items'
        Item.key = country_code
        delete Item.country_code

        db.put({
            TableName,
            Item
        }, (error, data) => {
            if (error) reject(error)
            resolve(data)
        })
    })
}

module.exports.editFooterMenuByCountryCode = (editFooter) => {
    return new Promise(async (resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        const { country_code } = editFooter
        let all_data = await this.getFooterByCountryCodeAdmin(country_code)
        editFooter.header_menu = editFooter.header_menu.map((r) => ({
            // id: r.id,
            title: r.title,
            path: r.path,
            usageType: r.usageType,
            externalLink: r.externalLink,
            handleFunction: r.handleFunction,
            externalLinkTarget: r.externalLinkTarget,
            // imageUrls: r.imageUrls,
            sortingHeader: r.sortingHeader,
            isEnable: r.isEnable
        }))


        editFooter.header_menu.sort(function (a, b) {
            return a.sortingHeader - b.sortingHeader
        })

        editFooter.header_menu.map((element) => {
            delete element.sortingHeader
        })

        all_data.footer.header_menu = editFooter.header_menu

        const Item = { ...all_data }
        Item.partition = 'items'
        Item.key = country_code

        delete Item.country_code

        db.put({
            TableName,
            Item
        }, (error, data) => {
            if (error) reject(error)
            resolve(data)
        })
    })
}

module.exports.removeEditFooterMenuOneByCountryCode = (editMenu, id) => {
    return new Promise(async (resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        const { countryCode } = editMenu
        let all_data = await this.getFooterByCountryCodeAdmin(countryCode)
        let all_menu = all_data.footer.header_menu
        const filter_menu = all_menu.filter(e => e.id != id)
        all_data.footer.header_menu = filter_menu
        const Item = { ...all_data }
        Item.partition = 'items'
        Item.key = countryCode

        delete Item.countryCode
        db.put({
            TableName,
            Item
        }, (error, data) => {
            if (error) reject(error)
            resolve(data)
        })
    })
}

module.exports.editFooterMenuOneByCountryCode = (editFooter) => {
    return new Promise(async (resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        const { country_code } = editFooter
        const { id } = editFooter.header_menu
        let all_data = await this.getFooterByCountryCodeAdmin(country_code)
        let all_menu = all_data.footer.header_menu
        const menu_index = all_menu.findIndex(e => e.id == id)
        all_menu[menu_index] = editFooter.header_menu
        all_data.footer.header_menu[menu_index] = all_menu[menu_index]
        const Item = { ...all_data }
        Item.partition = 'items'
        Item.key = country_code
        delete Item.country_code
        db.put({
            TableName,
            Item
        }, (error, data) => {
            if (error) reject(error)
            resolve(data)
        })
    })
}

module.exports.addFooterMenuOneByCountryCode = (editFooter) => {
    return new Promise(async (resolve, reject) => {
        const TableName = process.env.DYNAMODB_TABLE_MAIN
        const { country_code } = editFooter
        let all_data = await this.getFooterByCountryCodeAdmin(country_code)
        let all_menu = all_data.footer.header_menu
        all_menu.unshift(editFooter.header_menu)
        all_data.footer.header_menu = all_menu
        const Item = { ...all_data }
        Item.partition = 'items'
        Item.key = country_code
        delete Item.country_code
        db.put({
            TableName,
            Item
        }, (error, data) => {
            if (error) reject(error)
            resolve(data)
        })
    })
}