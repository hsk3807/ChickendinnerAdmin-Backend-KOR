const { utilsHelper } = require("lib-utils")
const { httpStatus } = require("lib-global-configs")
const ExampleService = require("../services/exampleService")
const ExampleSchema = require("../schemas/exampleSchema")

const { 
    createResponse, 
    createErrorResponse, 
    validateInput, 
    parseBodyJSON,
} = utilsHelper


const createOne = async e => {
    try{
        const body = parseBodyJSON(e.body)

        const { error: errorValidateBody, value: validatedBody } = validateInput(body, ExampleSchema.CREATE_DATA)
        if (errorValidateBody) throw {
            httpStatus: httpStatus.badRequest,
            error: { message: errorValidateBody.message }
        }

        const { insertId } = await ExampleService.createOne({ 
            data: {
                updated_by: 'create_anonymous',
                ...validatedBody,
            }
        })
        const data = await ExampleService.getOne({ id: insertId })

        return createResponse(httpStatus.ok, { data })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const updateOne = async e => {
    try{
        const body = parseBodyJSON(e.body)

        const { error: errorValidateBody, value: validatedBody } = validateInput(body, ExampleSchema.UPDATE_DATA)
        if (errorValidateBody) throw {
            httpStatus: httpStatus.badRequest,
            error: { message: errorValidateBody.message }
        }

        await ExampleService.updateOne({ 
            data: {
                updated_by: 'update_anonymous',
                updated_at: new Date().toISOString().replace("T", " ").substring(0, 22),
                ...validatedBody,
            }
         })

         const { id } = validatedBody
         const data = await ExampleService.getOne({ id })

        return data 
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: `id: ${id} notFound.` })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const deleteOne = async e => {
    try{
        const { id } = e.pathParameters || {}

        const { affectedRows } = await ExampleService.deleteOne({id})

        return affectedRows 
            ? createResponse(httpStatus.ok, { data: {message: `id: ${id} deleted.`} })
            : createResponse(httpStatus.notFound, { message: `id: ${id} notFound.` })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const getOne = async e => {
    try{
        const { id } = e.pathParameters || {}
        const data = await ExampleService.getOne({id})
        
        return data 
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: `id: ${id} notFound.` })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const getList = async e => {
    try{
        const { error: errorValidateParams, value: validatedParams } = validateInput(e.queryStringParameters || {}, ExampleSchema.GET_LIST)
        if (errorValidateParams) throw {
            httpStatus: httpStatus.badRequest,
            error: { message: errorValidateParams.message }
        }

        const { skip, limit } = validatedParams
        const items = await ExampleService.getList({ skip, limit })
        const data = { 
            skip, 
            limit, 
            items,
        }

        return createResponse(httpStatus.ok, { data })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

module.exports = {
    createOne,
    updateOne,
    deleteOne,
    getOne,
    getList,
}