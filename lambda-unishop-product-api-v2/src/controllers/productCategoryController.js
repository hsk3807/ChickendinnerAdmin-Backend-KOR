const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const PermissionHelpers = require('../utils/permissionHelpers')
const { validateInput } = require('../utils/validator')
const CategoryService = require("../services/productCategoryService")
const CategorySchema = require("../schema/productCategorySchema")
const ACCESS = require('../utils/accessConfig')

const getList = async e => {
    try {
        const { error: errorValidateParams, value: pararmsValid } = validateInput(e.queryStringParameters || {}, CategorySchema.GET_LIST)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const items = await CategoryService.getList(pararmsValid)

        const data = { items }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const create = async e => {
    try {
        const body = parseBodyJSON(e.body)

        const { error: errorValidateParams, value: validatedBody } = validateInput(body, CategorySchema.NEW_DATA)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const { country_code } = validatedBody
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(
            e,
            country_code,
            process.env.MODULE_KEY,
            ACCESS.WRITE
        )
        if (!isAllow) return createResponse(httpStatus.Unauthorized, { message: `Access Deny` })

        const { username: created_by } = decodedData
        const created_at = new Date().toISOString().replace("T", " ").substring(0, 22)
        const newData = {
            created_by,
            created_at,
            updated_by: created_by,
            updated_at: created_at,
            ...validatedBody
        }

        const { insertId } = await CategoryService.create(newData)
        const data = await CategoryService.getById(insertId)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const remove = async e => {
    try {
        const { id } = e.pathParameters || {}
        const category = await CategoryService.getById(id)
        if (!category) return createResponse(httpStatus.notFound, { message: `Not found.` })

        const { country_code } = category
        const { isAllow } = PermissionHelpers.checkAllow(
            e,
            country_code,
            process.env.MODULE_KEY,
            ACCESS.WRITE
        )
        if (!isAllow) return createResponse(httpStatus.Unauthorized, { message: `Access Deny` })

        const data = await CategoryService.removeById(id)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const editMultiple = async e => {
    try {
        const body = parseBodyJSON(e.body)
        const bodyArray = Array.isArray(body) ? body : [body]

        const { error: errorValidateBody, value: validatedBody } = validateInput(bodyArray, CategorySchema.EDIT_DATA_ARRAY)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const permissionCheckList = validatedBody
            .map(({ id, country_code }) => {
                const { isAllow, decodedData } = PermissionHelpers.checkAllow(e,
                    country_code,
                    process.env.MODULE_KEY,
                    ACCESS.WRITE
                )
                const { username } = decodedData || {}
                return {
                    id,
                    country_code,
                    isAllow,
                    username,
                }
            })
        const denyPermissionList = permissionCheckList.filter(r => !r.isAllow)
        if (denyPermissionList.length > 0) return createResponse(httpStatus.Unauthorized, {
            message: `Access Deny`,
            error: { data: denyPermissionList }
        })

        const updated_at = new Date().toISOString().replace("T", " ").substring(0, 22)
        const editDataList = validatedBody.map(r => {
            const { username: updated_by } = permissionCheckList.find(p => p.id === r.id && p.country_code === r.country_code)
            return { ...r, updated_at, updated_by }
        })

        const data = await CategoryService.editMultiple(editDataList)

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

module.exports = {
    getList,
    create,
    remove,
    editMultiple,
}