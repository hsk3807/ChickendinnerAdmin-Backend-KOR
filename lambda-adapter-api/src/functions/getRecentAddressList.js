const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const DashboardSchema = require('../schema/dashboardSchema')
const AddressService = require('../services/addressService')

const checkBySchema = async (inputObj, compareSchema) => {
    const { error, value } = validateInput(inputObj, compareSchema)
    if (error) throw error
    return value
}

module.exports.handler = async e => {
    try{
        const {
            "authorization-hydra": tokenHydra,
        } = e.headers
        const { customerHref } = e.queryStringParameters

        await checkBySchema({ tokenHydra, customerHref }, DashboardSchema.HYDRA_HEADER)

        const listOfAddress = await AddressService.getList({tokenHydra, customerHref})

        const data = JSON.stringify(listOfAddress.reverse())
        return createResponse(httpStatus.ok, {data})
    }catch(err){
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}