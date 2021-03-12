const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const PermissionHelpers = require('../utils/permissionHelpers')
const SettingsService = require("../services/settingsService")
const SettingsSchema = require("../schema/settingsSchema")
const ACCESS = require('../utils/accessConfig')
const { validateInput } = require('../utils/validator')

const getOne = async e => {
    try {
        const { countryCode } = e.pathParameters || {}
        const data = await SettingsService.getOne(countryCode)

        return data
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: "NotFound." })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const edit = async e => {
    try{
        const body = parseBodyJSON(e.body)
        
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, SettingsSchema.EDIT_DATA)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const { countryCode } = validatedBody
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_DATA_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { 
            username: updatedBy
        } = decodedData || {}
        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)

        const editData = {
            updatedBy,
            updatedAt,
            ...validatedBody,
        }

        const result = await SettingsService.editOne(editData)
        const { changedRows = 0 } = result || {}
        
        const data = result
        return changedRows 
            ? createResponse(httpStatus.ok, { data }) 
            : createResponse(httpStatus.notFound, { message: 'notFound' })
    }catch(err){
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const sleep = async ms => {
    setTimeout(() => {
        return `sleep: ${ms}.`
    }, ms);
}

const testTimeout = async e => {
    const { ms = 10 } = e.queryStringParameters || {}
    const data = await sleep(ms)
    return createResponse(httpStatus.ok, { data }) 
}

module.exports = {
    getOne,
    edit,
    testTimeout,
}