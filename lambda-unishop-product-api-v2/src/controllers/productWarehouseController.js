const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const WarehouseService = require("../services/productWarehouseService")
const ProductServie = require("../services/productService")
const WarehouseSchema = require("../schema/productWarehouseSchema")

const updateInventory = async () => {
    try {
        const [
            listOfCountry,
            counterList,
        ] = await Promise.all([
            ProductServie.getListOfCountry(),
            ProductServie.getRequestCounterList(),
        ])

        const processList = listOfCountry.reduce((list, countryCode) => {
            const couterRow = counterList.find(r => r.country_code === countryCode)
            const { updated_qty_at, updated_qty_second, hit } = couterRow || {}

            if (updated_qty_at && updated_qty_second) {
                const now = new Date()
                const lastUpdated = new Date(updated_qty_at)
                const secondDiff = Math.abs((now.getTime() - lastUpdated.getTime()) / 1000)

                if (secondDiff > updated_qty_second) {
                    const isStepDown = hit > 0 && updated_qty_second === 60 ? false
                        : hit <= 0 && updated_qty_second === 960 ? false : true

                    if (hit > 0) {
                        list.push(WarehouseService.updateInventory(countryCode, isStepDown))
                    } 
                    else {
                        if (secondDiff > updated_qty_second){
                            list.push(WarehouseService.updateInventory(countryCode, false))
                        }else{
                            if (isStepDown) {
                                list.push(WarehouseService.saveRequestCounterUnuse(countryCode))
                            }
                        }
                    }

                }
            } else {
                list.push(WarehouseService.updateInventory(countryCode))
            }

            return list
        }, [])
    
        const results = await Promise.allSettled(processList)
        return results
    } catch (err) {
        console.error(err)
    }
}

const getList = async e => {
    try {
        const { error: errorValidateParams, value: pararmsValid } = validateInput(e.queryStringParameters || {}, WarehouseSchema.GET_LIST)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const items = await WarehouseService.getList(pararmsValid)

        const data = { items }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

module.exports = {
    updateInventory,
    getList,
}