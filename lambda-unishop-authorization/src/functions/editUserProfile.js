const jwt = require('jsonwebtoken')
const { createResponse, httpStatus, parseBodyJSON, extractPermissions } = require('../utils/helpers')
const UserSchema = require('../schema/userSchema')
const { validateInput } = require('../utils/validator')
const UserService = require('../services/UserService')


module.exports.handler = async e => {
    try {
        // Check Token
        const { Authorization: token } = e.headers
        const tokenData = jwt.decode(token)
        const { username } = tokenData

        // Validate body
        const body = parseBodyJSON(e.body)
        const { settings } = body || {}
        const { countries } = settings || {}
        if (!countries) return createResponse(httpStatus.badRequest, { message: 'Invalid request data.' })

        // Validate Schema
        const coutryCodeList = Object.keys(countries).sort()
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, UserSchema.getEditUserProfileSchema(coutryCodeList))
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        // Update
        const userProfile = await UserService.getUserProfile(username)
        const updatedBy = username
        const updatedOn = new Date().toISOString()
        const updateData =  { ...userProfile, updatedBy, updatedOn, ...validatedBody }
        await UserService.updateUserProfile(username, updateData)

        const data = updateData
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message || err })
    }
}