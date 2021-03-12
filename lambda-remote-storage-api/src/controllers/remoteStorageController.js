const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const RemoteStorageService = require("../services/remoteStorageService")
const { v3 } = require('uuid')

const setItem = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const body = JSON.parse(e.body)

        if (!body) return createResponse(httpStatus.badRequest, { message: `Data should be JSON.` })

        const { keyData } = pathParams || {}
        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)


        const setItemData = {
            keyData,
            valueData: JSON.stringify(body),
            updatedAt,
        }
        await RemoteStorageService.replace(setItemData)

        const data = body
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getItem = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const { keyData } = pathParams || {}

        const storageItem = await RemoteStorageService.getOne(keyData)
        if (!storageItem) return createResponse(httpStatus.notFound, { message: `NotFound ${keyData}.` })

        const { valueData } = storageItem || {}

        const data = JSON.parse(valueData)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const removeItem = async e => {
    try{
        const pathParams = e.pathParameters || {}
        const { keyData } = pathParams || {}

        const deleteResult = await RemoteStorageService.deleteOne(keyData)
        const { affectedRows } = deleteResult || {}
        if (affectedRows < 1) return createResponse(httpStatus.notFound, { message: `NotFound ${keyData}.` })

        return createResponse(httpStatus.ok, { message: `Deleted ${keyData}.` })
    }catch(err){
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}


module.exports = {
    setItem,
    getItem,
    removeItem,
}