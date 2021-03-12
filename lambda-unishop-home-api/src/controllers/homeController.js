const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { removeUShopUrl } = require("../utils/converterHelper")
const { validateInput } = require('../utils/validator')
const homeSchema = require('../schema/homeSchema')
const PermissionHelpers = require('../utils/permissionHelpers')
const ACCESS = require('../utils/accessConfig')
const HomeService = require('../services/homeService')
const GeneralSchema = require("../schema/generalSchema")

const add = async e => {
    try {
        const body = parseBodyJSON(e.body)

        const { error: errorValidatedData, value: validatedData } = validateInput(body, homeSchema.ADD)
        if (errorValidatedData) return createResponse(httpStatus.badRequest, { message: errorValidatedData.message })

        const {
            countryCode,
            topSection,
            serviceSection,
        } = validatedData

        const { isAllow, decodedData, errMessage } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: errMessage })

        const { username: createdBy } = decodedData
        const createdAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const updatedBy = createdBy
        const updatedAt = createdAt

        const newData = {
            countryCode,
            createdBy,
            createdAt,
            updatedBy,
            updatedAt,
            data: JSON.stringify({
                topSection,
                serviceSection
            })
        }

        const result = await HomeService.create(newData)
        const data = result
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getOne = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const { isOrigin } = e.queryStringParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams

        let data = await HomeService.getOne(countryCode)
        if (!isOrigin) {
            const { button } = data.topSection || {}
            const {
                usageType,
                path,
                externalLink,
                externalLinkTarget,
                imageUrls,
                handleFunction,
                ...buttonProps
            } = button || {}
            data = {
                ...data,
                topSection: {
                    ...data.topSection,
                    button: {
                        ...buttonProps,
                        usageType,
                        path: usageType === "path" ? path : null,
                        externalLink: usageType === "externalLink" ? externalLink : null,
                        externalLinkTarget: usageType === "externalLink" ? externalLinkTarget : null,
                        imageUrls: usageType === "imageUrls" ? imageUrls : null,
                        handleFunction: usageType === "handleFunction" ? handleFunction : null,
                    }
                }
            }
        }

        return data ? createResponse(httpStatus.ok, { data }) : createResponse(httpStatus.notFound, { message: 'Not found.' })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}

const getOneV2 = async e => {
    try {
        const pathParams = e.pathParameters || {}
        const { isOrigin } = e.queryStringParameters || {}

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { countryCode } = validatedPathParams

        let data = await HomeService.getOne(countryCode)
        if (!isOrigin) {
            const { button } = data.topSection || {}
            const {
                usageType,
                path,
                externalLink,
                externalLinkTarget,
                imageUrls,
                handleFunction,
                ...buttonProps
            } = button || {}
            data = {
                ...data,
                topSection: {
                    ...data.topSection,
                    button: {
                        ...buttonProps,
                        usageType,
                        path: usageType === "path" ? path : null,
                        externalLink: usageType === "externalLink" ? externalLink : null,
                        externalLinkTarget: usageType === "externalLink" ? externalLinkTarget : null,
                        imageUrls: usageType === "imageUrls" ? imageUrls : null,
                        handleFunction: usageType === "handleFunction" ? handleFunction : null,
                    }
                }
            }
            let listVDO = [
                data.topSection.backgroundVideo.url.english,
                data.topSection.backgroundVideo.url.native,
                data.topSection.backgroundVideoMobile.url.english,
                data.topSection.backgroundVideoMobile.url.native
            ]
            listVDO = listVDO.reduce((x, y) => x.includes(y) ? x : [...x, y], [])
            data.topSection.listVDO = listVDO
            const findIndex_desktop_english = listVDO.findIndex(item => item === data.topSection.backgroundVideo.url.english)
            const findIndex_desktop_native = listVDO.findIndex(item => item === data.topSection.backgroundVideo.url.native)

            const findIndex_mobile_english = listVDO.findIndex(item => item === data.topSection.backgroundVideoMobile.url.english)
            const findIndex_mobile_native = listVDO.findIndex(item => item === data.topSection.backgroundVideoMobile.url.native)

            data.topSection.backgroundVideo.url.english = findIndex_desktop_english
            data.topSection.backgroundVideo.url.native = findIndex_desktop_native

            data.topSection.backgroundVideoMobile.url.english = findIndex_mobile_english
            data.topSection.backgroundVideoMobile.url.native = findIndex_mobile_native
        }

        return data ? createResponse(httpStatus.ok, { data }) : createResponse(httpStatus.notFound, { message: 'Not found.' })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}

const editOne = async e => {
    try {
        const body = parseBodyJSON(e.body)

        const { error: errorValidatedData, value: validatedData } = validateInput(body, homeSchema.ADD)
        if (errorValidatedData) return createResponse(httpStatus.badRequest, { message: errorValidatedData.message })

        const {
            countryCode,
            topSection,
            serviceSection,
            loginSection,
        } = validatedData

        const { isAllow, decodedData, errMessage } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: errMessage })

        const { username: updatedBy } = decodedData
        const updatedAt = new Date().toISOString().replace("T", " ").substring(0, 22)

        const editData = {
            updatedBy,
            updatedAt,
            data: JSON.stringify({
                topSection,
                serviceSection,
                loginSection,
            })
        }

        await HomeService.updateOne(countryCode, editData)

        const data = await HomeService.getOne(countryCode)

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

module.exports = {
    add,
    getOne,
    editOne,
    getOneV2
}