const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const TagService = require("../services/productTagService")
const TagSchema = require("../schema/productTagSchema")
const { getNativeLanguageCode } = require("../utils/dataTransformHelper")
const PermissionHelpers = require('../utils/permissionHelpers')

const getList = async e => {
    try {
        const { error: errorValidateParams, value: pararmsValid } = validateInput(e.queryStringParameters || {}, TagSchema.GET_LIST)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const { country_code, isNativeLanguage } = pararmsValid
        const nativeLanguageCode = getNativeLanguageCode(country_code)
        const items = isNativeLanguage
            ? await TagService.getListDisplayNative(nativeLanguageCode, pararmsValid)
            : await TagService.getList(pararmsValid)

        const data = { items }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const create = async e => {
    try {
        const { Authorization } = e.headers
        const body = parseBodyJSON(e.body)

        const createSchema = await TagSchema.getCreateSchema()
        const { error: errorValidateParams, value: validatedBody } = validateInput(body, createSchema)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        // Check Full Access
        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { username: created_by } = decodedData
        const created_at = new Date().toISOString().replace("T", " ").substring(0, 22)
        const newData = {
            created_by,
            created_at,
            updated_by: created_by,
            updated_at: created_at,
            ...validatedBody
        }

        const { insertId } = await TagService.create(newData)
        const data = await TagService.getById(insertId)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const editMultiple = async e => {
    try {
        const { Authorization } = e.headers
        const body = parseBodyJSON(e.body)
        const bodyArray = Array.isArray(body) ? body : [body]

        const editSchemaList = await TagSchema.getEditSchemaList()
        const { error: errorValidateBody, value: validatedBody } = validateInput(bodyArray, editSchemaList)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { username: updated_by } = decodedData
        const updated_at = new Date().toISOString().replace("T", " ").substring(0, 22)
        const editDataList = validatedBody.map(r => ({ updated_at, updated_by, ...r }))

        const data = await TagService.editMultiple(editDataList)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const remove = async e => {
    try {
        const { Authorization } = e.headers
        const { id } = e.pathParameters || {}

        // Check Full Access
        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const tag = await TagService.getById(id)
        if (!tag) return createResponse(httpStatus.notFound, { message: `Not found.` })

        const { is_system_tags } = tag
        if (is_system_tags) return createResponse(httpStatus.Unauthorized, { message: `Undeletable System Tag.` })

        const data = await TagService.removeById(id)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

module.exports = {
    getList,
    editMultiple,
    create,
    remove,
}