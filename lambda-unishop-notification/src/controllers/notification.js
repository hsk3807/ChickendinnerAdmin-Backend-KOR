const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const PermissionHelpers = require("../utils/permissionHelpers")
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
// const bannersSchema = require('../schema/bannersSchema')
const NotificationService = require("../services/notificationService")
const TokenGenerator = require("../utils/TokenGenerator")
const notificationSchema = require("../schema/notificationSchema")
const ACCESS = require('../utils/accessConfig')

const getListNotification = async e => {
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

        const data = await NotificationService.getData(options)
        return createResponse(httpStatus.ok, { data })

    } catch (err) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }
}

const getNotificationById = async e => {
    try {
        const { id } = e.pathParameters || {}
        const data = await NotificationService.getById(id)

        return data
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: "NotFound." })
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

        const { countryCode } = input[0]
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })
        // Check full access

        // const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        // const { isFullAccess } = decodedData
        // if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // Check schema
        const { error: errorValidateInput, value: validatedInput } = validateInput(input, notificationSchema.EDIT_MULTIPLE)
        if (errorValidateInput) return createResponse(httpStatus.badRequest, { message: errorValidateInput.message })

        // Check no edit data
        const noEditDataList = input.filter(({ id, ...cols }) => Object.keys(cols).length < 1)
        if (noEditDataList.length > 0) return createResponse(
            httpStatus.badRequest,
            { message: "At least 1 edit data.", error: { data: noEditDataList } }
        )

        const listOfInputId = validatedInput.map(({ id }) => id)
        const existsData = await NotificationService.getData({ inAnd: { id: listOfInputId } })
        const listOfExistId = existsData.map(r => r.id)
        const notFoundData = validatedInput.filter(r => !listOfExistId.includes(r.id))
        if (notFoundData.length > 0) return createResponse(
            httpStatus.notFound,
            { message: "NotFound.", error: { data: notFoundData.map(r => r.id) } }
        )
        const { username: updatedBy } = decodedData
        const updatedAt = new Date().toISOString()
        const editDataList = validatedInput.map(r => ({ updatedBy, updatedAt, ...r }))

        await NotificationService.editMultiple(editDataList)

        const data = await NotificationService.getData({ inAnd: { id: listOfInputId } })
        return createResponse(httpStatus.ok, { data })

    } catch (err) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }
}

const create = async e => {
    try {
        const { Authorization } = e.headers
        const body = parseBodyJSON(e.body)

        const { countryCode } = body
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        // const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        // const { isFullAccess } = decodedData
        // if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { error: errorValidateBody, value: validatedBody } = validateInput(body, notificationSchema.CREATE)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const { username: createdBy } = decodedData
        const createdAt = new Date().toISOString().replace("T", " ").substring(0, 22)
        const updatedBy = createdBy
        const updatedAt = createdAt
        console.log('validatedBody', validatedBody)
        const newData = {
            ...validatedBody,
            createdBy,
            createdAt,
            updatedBy,
            updatedAt
        }

        const result = await NotificationService.create(newData)
        const { insertId } = result || {}
        const data = await NotificationService.getById(insertId)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }
}

const deleteOne = async e => {
    try {
        const { Authorization } = e.headers
        const { id } = e.pathParameters || {}

        // Check full access
        // const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        // const { isFullAccess } = decodedData
        // if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })
        // const { id } = e.pathParameters || {}
        const data = await NotificationService.getById(id)

        const countryCode = data.countryCode
        const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
        if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { affectedRows } = await NotificationService.deleteById(id)
        return affectedRows
            ? createResponse(httpStatus.ok, { data: affectedRows })
            : createResponse(httpStatus.notFound, { message: "NotFound." })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}

const getPublicNotification = async e => {
    try {
        const { countryCode } = e.pathParameters || {}

        const { error: errorValidateCountryCode, value: countryCodeValid } = validateInput(countryCode, GeneralSchema.VALID_COUNTRY)
        if (errorValidateCountryCode) return createResponse(httpStatus.badRequest, { message: errorValidateCountryCode.message })
        const { error: errorParams, value: paramsValid } = validateInput(e.queryStringParameters || {}, notificationSchema.GET_PUBLISH)
        if (errorParams) return createResponse(httpStatus.badRequest, { message: errorParams.message })

        const {
            baId,
            token,
            status = null,
            userCountry = null,
        } = paramsValid

        const isPublic = !baId && !token && !status

        let notificationList = []

        if (isPublic) {
            notificationList = await NotificationService.getData({
                equalAnd: {
                    countryCode: countryCodeValid,
                    type: 'beforeLogin',
                    isEnable: 1
                }
            })
        } else {
            notificationList = await NotificationService.getData({
                equalAnd: {
                    countryCode: countryCodeValid,
                    type: 'afterLogin',
                    isEnable: 1
                }
            })
            notificationList = notificationList
                .filter(({ allowOnlyStatus }) => allowOnlyStatus.length > 0 ? allowOnlyStatus.includes(status) : true)
                .filter(({ allowOnlyBa }) => allowOnlyBa.length > 0 ? allowOnlyBa.includes(baId) : true)
                .filter(({ allowOnlyMarket }) => allowOnlyMarket.length > 0 ? allowOnlyMarket.includes(userCountry) : true)


            const listBaReadPopup = await NotificationService.getReadPopup(baId)
            console.log('listBaReadPopup', listBaReadPopup)
            if (listBaReadPopup.length > 0) {
                notificationList = notificationList.filter(item1 => {
                    console.log('item1', item1)
                    if (item1.isShowOnce === 'showOnlyOnce') {
                        return !listBaReadPopup.some(item2 => item1.id == item2.popup_id)
                    } else {
                        return 1
                    }
                })
            }
        }

        console.log('notificationList', notificationList)

        notificationList.forEach(function (v) {
            delete v.allowOnlyStatus,
                delete v.allowOnlyBa,
                delete v.allowOnlyMarket,
                delete v.isEnable,
                delete v.countryCode,
                delete v.type,
                delete v.createdBy,
                delete v.createdAt,
                delete v.updatedBy,
                delete v.updatedAt
        });

        const data = notificationList
        return createResponse(httpStatus.ok, { data })

    } catch (err) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }
}


const postAckPopup = async e => {
    try {
        const body = parseBodyJSON(e.body)

        const { error: errorValidateBody, value: validatedBody } = validateInput(body, notificationSchema.POST_ACK_POPUP)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })
        const {
            popupId,
            baId
        } = validatedBody

        try {
            let data
            const { affectedRows } = await NotificationService.readPopupAck(popupId, baId)
            if (affectedRows) {
                data = {
                    success: true
                }
            } else {
                data = {
                    success: false
                }
            }
            return createResponse(httpStatus.ok, { data })
        } catch (err) {
            console.error(err)
            return createResponse(httpStatus.InternalServerError, { message: err })
        }

    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}

module.exports = {
    getListNotification,
    getNotificationById,
    edit,
    create,
    deleteOne,
    getPublicNotification,
    postAckPopup
}