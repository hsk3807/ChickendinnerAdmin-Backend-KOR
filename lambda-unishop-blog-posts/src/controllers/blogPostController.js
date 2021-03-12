const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const blogPostSchema = require("../schema/blogPostSchema")
const PermissionHelpers = require('../utils/permissionHelpers')
const BlogPostService = require("../services/blogPostService")

const add = async e => {
    try {
        const { Authorization } = e.headers
        const body = parseBodyJSON(e.body)

        // Check path params
        const { error: errorValidatedBody, value: valitedBody } = validateInput(body, blogPostSchema.CREATE)
        if (errorValidatedBody) return createResponse(httpStatus.badRequest, { message: errorValidatedBody.message })
        
        const { username } = PermissionHelpers.getDecodeToken(Authorization)
        const createdAt = new Date().toISOString().replace("T", " ").substring(0, 22)

        const newBlogPost = {
            createdBy: username,
            createdAt,
            updatedBy: username,
            updatedAt: createdAt,
            ...valitedBody,
        }

        const {insertId} =  await BlogPostService.create(newBlogPost)
        const createdData = await BlogPostService.getById(insertId)

        const data = createdData
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const edit = async e => {
    try {
        const { Authorization } = e.headers
        const {id} = e.pathParameters || {}
        const body = parseBodyJSON(e.body)

        const { error: errorValidatedBody, value: valitedBody } = validateInput(body, blogPostSchema.UPDATE)
        if (errorValidatedBody) return createResponse(httpStatus.badRequest, { message: errorValidatedBody.message })
        
        const { username } = PermissionHelpers.getDecodeToken(Authorization)
        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)

        const updateData = {
            updatedBy: username,
            updatedAt,
            ...valitedBody,
        }

        const { affectedRows } = await BlogPostService.update(id, updateData)
        const data = affectedRows > 0
            ? await BlogPostService.getById(id)
            : null

        return data
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: `NotFound ${id}.` })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getOne = async e => {
    try {
        const {id} = e.pathParameters || {}
        const data = await BlogPostService.getById(id)
        
        return data
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: `NotFound ${id}` })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getList = async e => {
    try {
        const {
            createdAtBegin,
            createdAtEnd,
            updatedAtBegin,
            updatedAtEnd,
            channel,
            keyword,
            skip = 0,
            limit = 100,
        } = e.queryStringParameters || {}

        const data = await BlogPostService.getList({
            createdAtBegin,
            createdAtEnd,
            updatedAtBegin,
            updatedAtEnd,
            channel,
            keyword,
            skip,
            limit,
        })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const remove = async e => {
    try {
        const {id} = e.pathParameters || {}
        const {affectedRows} = await BlogPostService.deleteById(id)
        return affectedRows > 0 
            ? createResponse(httpStatus.ok, { data: {affectedRows} })
            : createResponse(httpStatus.notFound, { message: `NotFound ${id}` })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getSchema = async () => {
    const data = await blogPostSchema.CREATE.validate({})
    return createResponse(httpStatus.ok, { data })
}


module.exports = {
    add,
    edit,
    getOne,
    getList,
    remove,
    getSchema,
}