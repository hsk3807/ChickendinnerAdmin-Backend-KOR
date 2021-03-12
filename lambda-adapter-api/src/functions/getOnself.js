const { createResponse, httpStatus } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const { tokenGenerator } = require("lib-utils")
const DashboardSchema = require("../schema/dashboardSchema")
const OnselfServices = require("../services/onselfServices")
const MockupHelper = require("../utils/mockupHelper")
const AdapterMockupService = require("../services/adapterMockupService")
const S3Service = require("../services/s3Service")

module.exports.handler = async e => {
    try {
        const { "authorization-hydra": tokenHydra } = e.headers;
        const {
            byPassCache = false,
            hitCouter = true,
            baId,
            token,
        } = e.queryStringParameters || {};

        console.info('==GET:Onself QueryStringParameters', e.queryStringParameters)

        // Check args
        const { error: errorArgs } = validateInput({ tokenHydra, baId, token }, DashboardSchema.ARGS_ONSELF);
        if (errorArgs) return createResponse(httpStatus.badRequest, { message: errorArgs.message })

        // Check Token
        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        // Mockup usage
        const isUseMockup = MockupHelper.checkUsageByBaId(baId)
        if (isUseMockup) {
            const { S3_BUCKET_MEDIA } = process.env
            
            let [
                mockupData,
                listOfProfilePictureUrls = [],
            ] = await Promise.all([
                AdapterMockupService.getOnself(),
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
            if (mockupData) return createResponse(httpStatus.ok, { data: JSON.stringify(blendData) })
        }

        const result = await OnselfServices.getData({
            tokenHydra,
            baId,
            byPassCache,
            requestData: JSON.stringify(e),
            hitCouter,
        })

        const data = JSON.stringify(result)
        return createResponse(httpStatus.ok, { data });
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}