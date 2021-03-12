const { number } = require("joi")
const { httpStatus, sitesConfig, mappingStatusList } = require("lib-global-configs")
const { utilsHelper, tokenGenerator, permissionHelper } = require("lib-utils")
const { createResponse, createErrorResponse, validateInput, parseBodyJSON, formatErrorController } = utilsHelper
const EtlConfigSchema = require("../schema/etlConfigSchema")
const EtlConfigService = require("../services/etlConfigService")

const toError = (name, err) => formatErrorController(`etlConfigController-${name}`, err)

const checkAllow = ({e, countryCode}) => permissionHelper.checkAllow({e, countryCode, moduleKey: process.env.MODULE_KEY})

const getOne = async e => {
    try{
        const { 
            ushopCountryCode: ushopCountryCodeInput,
        } = e.pathParameters || {}

        const inputParams = {
            ushopCountryCode: ushopCountryCodeInput,
        }

        const { error: errorParams, value: validParams } = validateInput(inputParams, EtlConfigSchema.GET_ONE)
        if (errorParams) throw {
            httpStatus: httpStatus.badRequest, 
            error:{ message: errorParams.message },
        }

        const {
            ushopCountryCode
        } = validParams

        const data = await EtlConfigService.getOne({ ushopCountryCode })
        
        return data 
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: `${ushopCountryCode} notFound.` })

    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const editOne = async e => {
    try{
        const body = parseBodyJSON(e.body)

        const { error: errorValidateBody, value: validatedBody } = validateInput(body, EtlConfigSchema.EDIT_ONE)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const { ushopCountryCode } = validatedBody

        const { isAllow, moduleKey } = checkAllow({e, countryCode: ushopCountryCode})
        if (!isAllow) throw {
            httpStatus: httpStatus.Unauthorized, 
            error:{ message: `Access deny ${ushopCountryCode}::${moduleKey}.` },
        }

        const { affectedRows } = await EtlConfigService.editOne({ editData: body })
        const editedData = affectedRows ? await EtlConfigService.getOne({ ushopCountryCode }) : null
    
        const data = editedData
        return data 
            ? createResponse(httpStatus.ok, { data })
            : createResponse(httpStatus.notFound, { message: `${ushopCountryCode} notFound.` })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

module.exports = {
    getOne,
    editOne,
}