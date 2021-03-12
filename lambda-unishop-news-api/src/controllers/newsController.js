const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const ACCESS = require('../utils/accessConfig')
const NewsSchema = require("../schema/newsSchema")
const NewsService = require("../services/newsService")
const PermissionHelpers = require("../utils/permissionHelpers")
const GeneralSchema = require("../schema/generalSchema")
const TokenGenerator = require("../utils/TokenGenerator")

const add = async e => {
    try {
        const { Authorization } = e.headers
        const body = parseBodyJSON(e.body)
        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, NewsSchema.CREATE)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const { username: createdBy } = decodedData
        const createdAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const updatedBy = createdBy
        const updatedAt = createdAt

        const newData = {
            ...validatedBody,
            createdBy,
            createdAt,
            updatedBy,
            updatedAt
        }

        const result = await NewsService.create(newData)
        const { insertId } = result || {}
        const data = await NewsService.getById(insertId)
        return createResponse(httpStatus.ok, { data })

    } catch (err) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }

}

const edit = async e => {
    try {
        const { Authorization } = e.headers
        const body = parseBodyJSON(e.body)
        const input = Array.isArray(body) ? body : [body]

        // Check full access
        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Check schema
        const { error: errorValidateInput, value: validatedInput } = validateInput(input, NewsSchema.EDIT_MULTIPLE)
        if (errorValidateInput) return createResponse(httpStatus.badRequest, { message: errorValidateInput.message })

        // Check no edit data
        const noEditDataList = input.filter(({ id, ...cols }) => Object.keys(cols).length < 1)
        if (noEditDataList.length > 0) return createResponse(
            httpStatus.badRequest,
            { message: "At least 1 edit data.", error: { data: noEditDataList } }
        )

        // Check NotFound Data
        const listOfInputId = validatedInput.map(({ id }) => id)
        const existsData = await NewsService.getList({ inAnd: { id: listOfInputId } })
        const listOfExistId = existsData.map(r => r.id)
        const notFoundData = validatedInput.filter(r => !listOfExistId.includes(r.id))
        if (notFoundData.length > 0) return createResponse(
            httpStatus.notFound,
            { message: "NotFound.", error: { data: notFoundData.map(r => r.id) } }
        )

        const { username: updatedBy } = decodedData
        const updatedAt = new Date().toISOString()
        const editDataList = validatedInput.map(r => ({ updatedBy, updatedAt, ...r }))
        await NewsService.editMultiple(editDataList)

        const data = await NewsService.getList({ inAnd: { id: listOfInputId } })
        return createResponse(httpStatus.ok, { data })

    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}

const getOne = async e => {
    try {
        const { id } = e.pathParameters || {}
        let data = await NewsService.getById(id)
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
        const { country_code } = e.pathParameters || {}
        let options = {}
        if (country_code) {
            const { error: errorValidateCountryCode, value: countryCodeValid } = validateInput(country_code, GeneralSchema.VALID_COUNTRY)
            if (errorValidateCountryCode) return createResponse(httpStatus.badRequest, { message: errorValidateCountryCode.message })
            options = {
                ...options,
                equalAnd: {
                    countryCode: countryCodeValid
                }
            }
        }

        const data = await NewsService.getList(options)
        console.log('data', data)
        return createResponse(httpStatus.ok, { data })

    } catch (err) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }
}

const remove = async e => {
    try {
        const { Authorization } = e.headers
        const { id } = e.pathParameters || {}
        const data = await NewsService.getById(id)
        if (!data) return createResponse(httpStatus.notFound, { message: `NotFound ${id}.` })

        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { affectedRows } = await NewsService.deleteById(id)
        return affectedRows > 0
            ? createResponse(httpStatus.ok, { data: { affectedRows } })
            : createResponse(httpStatus.notFound, { message: `NotFound ${id}.` })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getListPublice = async e => {
    try {
        const { country_code, type } = e.pathParameters || {}
        const { baId, token } = e.queryStringParameters || {}
        // let options = {}
        // if (country_code) {
        const { error: errorValidateCountryCode, value: countryCodeValid } = validateInput(country_code, GeneralSchema.VALID_COUNTRY)
        if (errorValidateCountryCode) return createResponse(httpStatus.badRequest, { message: errorValidateCountryCode.message })
        // options = {
        //   ...options,
        //   equalAnd: {
        //     countryCode: countryCodeValid,
        //     isEnable: 1,
        //   }
        // }
        // }
        let data
        const isPublic = !baId && !token

        // show only after login isLoginRequired 1, isDisableOnLogin

        if (isPublic) { // no login
            data = await NewsService.getListPublic({
                equalAnd: {
                    countryCode: countryCodeValid,
                    isEnable: 1,
                    isLoginRequired: 0,
                    type: type
                }
            })

        } else { // login
            const isValidToken = TokenGenerator.validate(baId, token)
            if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "invalid token." });
            data = await NewsService.getListPublic({
                equalAnd: {
                    countryCode: countryCodeValid,
                    isEnable: 1,
                    isDisableOnLogin: 0,
                    type: type
                }
            })
        }

        // data = data.map((element) => ({
        //     id: element.id,
        //     type: element.type,
        //     title: element.title,
        //     blogContent: element.blogContent,
        //     newsImages: element.newsImages
        // }))
        data = data.map((element) => {
            if (element.type === 'download') {
                let m = element.urlDownload.split(".")
                let fileType
                if (m && m.length > 1) {
                    fileType = m[m.length - 1];
                }
                return {
                    id: element.id,
                    url: element.urlDownload,
                    title: element.title,
                    fileType: fileType
                }
            }
            else if (element.type === 'gallery') {
                return {
                    id: element.id,
                    title: element.title,
                    galleryImages: element.newsImages.english
                }
            } else if (element.type === 'blog') {
                return {
                    id: element.id,
                    title: element.title,
                    content: element.blogContent,
                    blogType: element.blogType,
                    blogImages: element.newsImages
                }
            }
        })


        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }
}

module.exports = {
    add,
    edit,
    getOne,
    getList,
    remove,
    getListPublice
}

