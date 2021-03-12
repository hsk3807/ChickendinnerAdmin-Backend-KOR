const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const DashboardSchema = require('../schema/dashboardSchema')
const AddressService = require('../services/addressService')
const equal = require('fast-deep-equal');

const checkBySchema = async (inputObj, compareSchema) => {
    const { error, value } = validateInput(inputObj, compareSchema)
    if (error) throw error
    return value
}

const checkEqualAddress = (r1,r2) => equal(
    {
        shipToAddress: r1.shipToAddress,
        shipToName: r1.shipToName
    },
    {
        shipToAddress: r2.shipToAddress,
        shipToName: r2.shipToName
    }
)

module.exports.handler = async e => {
    try{
        const {
            "authorization-hydra": tokenHydra,
        } = e.headers
        const { customerHref } = e.queryStringParameters

        const body = parseBodyJSON(e.body)

        await checkBySchema({ tokenHydra, customerHref }, DashboardSchema.HYDRA_HEADER)

        const listOfAddressOrigin = await AddressService.getList({tokenHydra, customerHref})

        // Remove 1st address if more 17
        if (listOfAddressOrigin.length > 17){
            const [ firstAddress ] = listOfAddressOrigin
            const { addressHref } = firstAddress
            await AddressService.delete({tokenHydra, customerHref, addressHref})
        }

        // Add 
        const { error: errorAdd } = await AddressService.add({
            tokenHydra, 
            customerHref, 
            newValue : body
        })
        if (errorAdd){
            console.error(errorAdd)
            return createResponse(
                errorAdd.status, 
                { 
                    message: errorAdd.data.error.message
                }
            )
        }

        // Remove Duplicate
        const listOfAddressUpdated = await AddressService.getList({tokenHydra, customerHref})
        const duplicateGroup = listOfAddressUpdated
            .map(r1 => {
                const groupIndex = listOfAddressUpdated.findIndex(r2 => checkEqualAddress(r1,r2))
                return { groupIndex, ...r1}
            })
            .reduce((obj, r)=>{
                const { groupIndex } = r

                if (!Array.isArray(obj[groupIndex])) obj[groupIndex] = []
                obj[groupIndex] = [...obj[groupIndex], r]

                return obj
            }, {})
        
        // Delete Duplicate
        const deleteList = Object.keys(duplicateGroup)
            .reduce((list, groupKey)=> [
                ...list, 
                ...duplicateGroup[groupKey].slice(0, duplicateGroup[groupKey].length -1)
            ]
            , [])
            .map(({addressHref}) => addressHref)
        if (deleteList.length > 0){
            await Promise.all(deleteList.map(addressHref => AddressService.delete({tokenHydra, customerHref, addressHref})))
        }

        const data = JSON.stringify({})
        return createResponse(httpStatus.ok, {data})
    }catch(err){
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }

    
}