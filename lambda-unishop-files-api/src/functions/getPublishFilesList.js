const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const DownloadfilesService = require("../services/downloadfilesService")
const HydraPermissionsService = require("../services/hydraPermissionsService")

const checkAvalibleDate = (beginDate, endDate, currentDate) =>{
    if (beginDate && endDate){
        if (currentDate < beginDate || currentDate > endDate) return false
    }else if (beginDate && !endDate){
        if (currentDate < beginDate) return false
    }else if (!beginDate && endDate){
        if (currentDate > endDate) return false
    }

    return true
}

module.exports.handler = async e => {
    try {
        const pathParams = e.pathParameters
        const { } = e.headers
        const {
            "authorization-hydra": tokenHydra = "",
        } = e.headers

        const { error: errorValidate, value: validatedPathParams } = validateInput(pathParams, GeneralSchema.COUNTRY_CODE)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const [_, token] = tokenHydra.split(" ")
        let isAlreadyLogin = false
        if (token) {
            const { error: errorCheckToken, data: checkedTokenData } = await HydraPermissionsService.checkToken(token)
            if (errorCheckToken) return createResponse(errorCheckToken.httpStatus, { message: errorCheckToken.message })

            const { permissions } = checkedTokenData
            const isAllow = permissions.includes('customer')
            if (!isAllow) return createResponse(httpStatus.Unauthorized, { message: 'Unauthorized' })

            isAlreadyLogin = true
        }

        const { countryCode } = validatedPathParams
        const { error: errorGetList, data: downloadFileList } = await DownloadfilesService.getListData(countryCode)
        if (errorGetList) return createResponse(errorGetList.httpStatus, { message: errorGetList.message })

        const currentDate = new Date()
        const publishList = downloadFileList
            .filter(({ isEnable }) => isEnable)
            .filter(({ isRequireLogin }) => isAlreadyLogin ? true : isRequireLogin === false)
            .filter(({ publishDate }) => {
                const { begin, end } = publishDate
                const beginDate = begin ? new Date(begin) : null
                const endDate = end ? new Date(end) : null

                return checkAvalibleDate(beginDate, endDate, currentDate)
            })

        const data = JSON.stringify(publishList)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}