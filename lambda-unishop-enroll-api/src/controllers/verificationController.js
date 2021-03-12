const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const VerificationService = require('../services/verificationService')
const VerificationSchema = require('../schema/verificationSchema')
const verificationService = require('../services/verificationService')
const ACCESS = require('../utils/accessConfig')
const PermissionHelpers = require('../utils/permissionHelpers')

const getList = async e => {
    try {
        const {
            keywords,
            keywords_not,
        } = e.multiValueQueryStringParameters

        const inputParams = {
            ...e.queryStringParameters,
            keywords,
            keywords_not,
        }

        const { error: errorValidateParams, value: pararmsValid } = validateInput(inputParams || {}, VerificationSchema.GET_LIST)
        if (errorValidateParams) return createResponse(httpStatus.badRequest, { message: errorValidateParams.message })

        const {
            skip,
            limit,
        } = pararmsValid

        const [
            verifications,
            total,
        ] = await Promise.all([
            VerificationService.getList(pararmsValid),
            VerificationService.getCount(pararmsValid),
        ])

        const items = verifications

        const data = {
            skip,
            limit,
            total,
            items,
        }
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

        const { error: errorValidateBody, value: validatedBody } = validateInput(bodyArray, VerificationSchema.EDIT_DATA_ARRAY)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const originData = await verificationService.getList({ listOfId: validatedBody.map(r => r.id) })
        const listOfNotFound = validatedBody.filter(r => originData.findIndex(o => r.id === o.id) < 0)
        if (listOfNotFound.length > 0) return createResponse(httpStatus.notFound, { message: "NotFound.", error: { data: listOfNotFound } })

        const permissionCheckList = originData
            .map(({ id, country_code }) => {
                const { isAllow, decodedData } = PermissionHelpers.checkAllow(
                    e,
                    country_code,
                    'idVerification',
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
        if (denyPermissionList.length > 0) return createResponse(
            httpStatus.Unauthorized,
            {
                message: `Access Deny`,
                error: { data: denyPermissionList }
            }
        )

        const approval_at = new Date().toISOString().replace("T", " ").substring(0, 19)
        const editDataList = validatedBody.map(r => {
            const { username: approval_by } = permissionCheckList.find(p => p.id === r.id)
            return { ...r, approval_at, approval_by }
        })

        const data = await verificationService.editMultiple(editDataList)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}

const moveImages = async e => {
    try{
        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, VerificationSchema.MOVE_IMAGES_TO_PRIVATE)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const { 
            country_code,
            list = [],
        } = validatedBody

        const tempImages = await VerificationService.getTempImages(country_code)
        const moveImages = list.filter(r => tempImages.includes(r.fileName))
        const moveResults = await VerificationService.moveToPrivateImages({country_code, list: moveImages})

        const data = moveResults
        return createResponse(httpStatus.ok, { data })
    }catch(err){
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}

module.exports = {
    getList,
    editMultiple,
    moveImages,
}