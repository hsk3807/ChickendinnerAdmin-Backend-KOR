const { createResponse, httpStatus } = require('../../utils/helpers')
const { validateInput } = require('../../utils/validator')
const { tokenGenerator } = require("lib-utils")
const DashboardSchema = require("../../schema/dashboardSchema")
const MockupHelper = require("../../utils/mockupHelper")
const S3Service = require("../../services/s3Service")
const etlOnselfServices = require('../../services/etlOnselfServices')
const EtlAdapterMockupService = require("../../services/etlAdapterMockupService")
const get = require('lodash.get')

const IGNORE_CACHE_COUNTRY = ["KOR"]

module.exports.handler = async e => {
    try {
        const { "authorization-hydra": tokenHydra } = e.headers;
        const {
            // byPassCache = false,
            hitCouter = true,
            baId,
            token,
            ushopCountryCode = null,
            isMockup,
        } = e.queryStringParameters || {};
        const byPassCache = true // force bypass cache

        const source_url = get(e, 'headers.referer', 'No Referer')

        console.info('==GET:Onself QueryStringParameters', e.queryStringParameters)

        // Check args
        const { error: errorArgs } = validateInput({ tokenHydra, baId, token }, DashboardSchema.ARGS_ONSELF);
        if (errorArgs) return createResponse(httpStatus.badRequest, { message: errorArgs.message })

        // Check Token
        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        // Mockup usage
        const isUseMockup = MockupHelper.checkUsageByBaId(baId) || !!isMockup 
        if (isUseMockup) {
            const { S3_BUCKET_MEDIA } = process.env
            
            let [
                mockupData,
                listOfProfilePictureUrls = [],
            ] = await Promise.all([
                EtlAdapterMockupService.getOnself(),
                S3Service.getFileListAll({ Bucket: S3_BUCKET_MEDIA, Prefix: "images/avatar/" })
            ])

            const blendData = MockupHelper.getBlendData(
                mockupData,
                {
                    listOfProfilePictureUrls: listOfProfilePictureUrls
                        .map(({ Key }) => Key)
                        .map(imgPath => `https://ushop-media.unicity.com/${imgPath}`),
                }
            )
            if (mockupData) return createResponse(httpStatus.ok, { data: JSON.stringify({
                isMockup: !!isMockup ,
                ...blendData
            }) })
        }

        const isIgnoreCache = IGNORE_CACHE_COUNTRY.includes(ushopCountryCode)
        const result = isIgnoreCache 
            ? await etlOnselfServices.getDataIgnoreCache({
                tokenHydra,
                baId,
                source_url,
            })
            : await etlOnselfServices.getData({
                tokenHydra,
                baId,
                byPassCache,
                requestData: JSON.stringify(e),
                hitCouter,
                source_url
            })

        const data = JSON.stringify(result)
        return createResponse(httpStatus.ok, { data });
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}