const { v1 } = require('uuid')
const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const PermissionHelpers = require("../utils/permissionHelpers")
const BrokerSchema = require("../schema/brokerSchema")
const BrokerService = require("../services/brokerService")



const deposit = async e => {
    try {
        const { Authorization: token } = e.headers || {}
        const body = parseBodyJSON(e.body)

        const { error: errorValidatedData, value: validatedData } = validateInput(body, BrokerSchema.ADD)
        if (errorValidatedData) return createResponse(httpStatus.badRequest, { message: errorValidatedData.message })

        const { username: createdBy } = PermissionHelpers.getDecodeToken(token)
        const createdAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const id = v1().split("-").reverse().join("")

        const { payload, expire } = validatedData

        const depositData = {
            id,
            createdBy,
            createdAt,
            payload: JSON.stringify(payload),
            expire,
        }

        await BrokerService.insert(depositData)

        const data = await BrokerService.getOne(id)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const withdraw = async e => {
    try {
        const { id } = e.pathParameters || {}
        const data = await BrokerService.getOne(id)

        if (data) {
            const { expire } = data || {}
            const isExpired = expire ? new Date() > new Date(expire) : true
            if (isExpired) await BrokerService.deleteOne(id)
            
            return createResponse(httpStatus.ok, { data })
        } else {
            return createResponse(httpStatus.notFound, { message: `NotFound ${id}` })
        }
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}


module.exports = {
    deposit,
    withdraw,
}