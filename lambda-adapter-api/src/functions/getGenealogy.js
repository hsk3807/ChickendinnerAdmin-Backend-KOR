const { tokenGenerator } = require("lib-utils")
const { createResponse, httpStatus, createHashHref } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const DashboardSchema = require('../schema/dashboardSchema')
const GenealogyServices = require('../services/genealogyServices')
const MockUpGenerator = require("../mockUps/MockUpGenerator");
const MockupHelper = require("../utils/mockupHelper")
const AdapterMockupService = require("../services/adapterMockupService")
const DashboardService = require("../services/dashboardService")
const S3Service = require("../services/s3Service")

const handlAutoFetch = async (
    baId,
    res,
    e,
) => {
    try {
        const { genealogy = {} } = res
        const { items = [] } = genealogy
        const listOfHref = items
            .map(r => {
                const { customer } = r || {}
                const {
                    unicity: baId,
                    metricsProfileHistory = {},
                } = customer || {}
                const { items: historyItems = [] } = metricsProfileHistory
                const [_, prevMonthItem] = historyItems

                const ov = prevMonthItem ? prevMonthItem.value.ov : null
                return { baId, ov }
            })
            .filter(r => r.baId !== baId)
            .sort((r1, r2) => r1.ov > r2.ov ? -1 : r1.ov < r2.ov ? 1 : 0)
            .slice(0, 3)
            .reduce((list, r) => {
                const invokeParams = JSON.parse(JSON.stringify(e))
                invokeParams.queryStringParameters.baId = r.baId
                invokeParams.queryStringParameters.token = tokenGenerator.create(r.baId)
                invokeParams.queryStringParameters.prepareCache = false
                invokeParams.queryStringParameters.hitCouter = false

                console.info('==AutoFetch getGenealogy', { ...r, ...invokeParams.queryStringParameters })
                list.push(GenealogyServices.invokePrepareCache(invokeParams))

                // console.info('==AutoFetch getOrderHistory', {...r, ...invokeParams.queryStringParameters})
                // list.push(OrderHistoryService.invokePrepareCache(invokeParams))

                return list
            }, [])

        return Promise.allSettled(listOfHref)
    } catch (err) {
        console.error(err)
        throw err
    }
}

const getPrevMonthOv = genealogyItem => {
    const { customer = {} } = genealogyItem || {}
    const { metricsProfileHistory = {} } = customer
    const { items = [] } = metricsProfileHistory
    const [_, prevMonth = {}] = items
    return prevMonth ? prevMonth.value.ov : null
}

const getBaId = genealogyItem => {
    const { customer = {} } = genealogyItem || {}
    const { unicity } = customer
    return unicity
}

module.exports.handler = async e => {
    try {
        const {
            baId,
            token,
            byPassCache = false,
            prepareCache = true,
            hitCouter = true,
            maxTreeDepth = 1,
            ushopCountryCode,
        } = e.queryStringParameters || {}
        const { disable: disableList = [] } = e.multiValueQueryStringParameters || {}

        console.info('==GET:Genealogy QueryStringParameters', e.queryStringParameters)

        if (!token) return createResponse(httpStatus.forbidden, { message: "token required." });
        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        if (Object.keys(e.queryStringParameters).includes("mockup")) {
            const mockDData = await MockUpGenerator.getRandomGenealogy();
            const data = JSON.stringify(mockDData);
            return createResponse(httpStatus.ok, { data });
        }

        const {
            "authorization-hydra": tokenHydra,
        } = e.headers

        // check data
        const { error: errorInput, value: inputValid } = validateInput(
            {
                tokenHydra,
                baId,
            },
            DashboardSchema.GENEALOGY
        );
        if (errorInput) return createResponse(httpStatus.badRequest, { message: errorInput.message })

        // Mockup usage
        const isUseMockup = MockupHelper.checkUsageByBaId(baId)
        if (isUseMockup) {
            const listOfBaId = [5710366, 2996566, 11443665, 8444566, 3148266]
            const randomBaId = listOfBaId[Math.floor(Math.random() * listOfBaId.length)]
            const { S3_BUCKET_MEDIA } = process.env

            let [
                mockupData,
                seminar,
                listOfProfilePictureUrls = [],
            ] = await Promise.all([
                AdapterMockupService.getGenealogy(),
                DashboardService.getSeminar({
                    baId: randomBaId,
                    params: { country_code: 'tha' }
                }),
                S3Service.getFileListAll({ Bucket: S3_BUCKET_MEDIA, Prefix: "images/avatar/" })
            ])

            let blendData = MockupHelper.getBlendData(
                {
                    ...mockupData,
                    seminar,
                },
                {
                    replaceBaId: baId,
                    listOfProfilePictureUrls: listOfProfilePictureUrls
                        .map(({ Key }) => Key)
                        .map(imgPath => `https://ushop-media.unicity.com/${imgPath}`),
                }
            )

            if (mockupData) return createResponse(httpStatus.ok, { data: JSON.stringify(blendData) })
        }

        const {
            tokenHydra: tokenHydraValid,
            baId: baIdValid,
        } = inputValid

        const isSaveCache = maxTreeDepth == 1
        const disableOptions = disableList.reduce((obj, disableKey) => ({ ...obj, [disableKey]: true }), {})
        let res = await GenealogyServices.getWithCatchGenealogy(
            tokenHydraValid,
            baIdValid,
            {
                maxTreeDepth,
                limit: 256,
                expand: "self,profilePicture",
            },
            isSaveCache ? byPassCache : true,
            JSON.stringify(e),
            hitCouter,
            isSaveCache,
            disableOptions,
            ushopCountryCode,
        )

        // prepare other downl
        if (prepareCache && res.genealogy) {
            console.time(`AutoFetch by ${baId}`)
            console.info(`==AutoFetch by ${baId}`)
            const fetchResults = await handlAutoFetch(baIdValid, res, e)
            console.info(`==AutoFetch by ${baId} results`, fetchResults)
            console.timeEnd(`AutoFetch by ${baId}`)
        }

        const hasDownline = res && res.genealogy && Array.isArray(res.genealogy.items) && res.genealogy.items.length > 0
        if (!hasDownline && res.genealogy) {
            // replace profile into first items empty array
            const customerHref = createHashHref(baId, 'customer')
            const profile = await DashboardService.getBoxProfile({
                tokenHydra,
                customerHref,
                params: { expand: `metricsProfileHistory,profilePicture` }
            })
            res.genealogy.items = [{ customer: profile, treeDepth: 0 }]
        }

        if (res.genealogy) {
            const { items: originItems = [] } = res.genealogy || {}
            const [uplineItem] = originItems

            let itemsSortOV = JSON.parse(JSON.stringify(originItems))
                .filter(r => {
                    const itemBaId = getBaId(r)
                    return itemBaId !== baIdValid
                })
                .sort((r1, r2) => {
                    const ovR1 = getPrevMonthOv(r1)
                    const ovR2 = getPrevMonthOv(r2)
                    return ovR1 > ovR2 ? -1 : ovR1 < ovR2 ? 1 : 0
                })
            itemsSortOV = [...(uplineItem ? [uplineItem] : []), ...itemsSortOV]
            res.genealogy.itemsSortOV = itemsSortOV

            let itemsHideZero = JSON.parse(JSON.stringify(originItems))
                .filter(r => {
                    const itemBaId = getBaId(r)
                    const ov = getPrevMonthOv(r)
                    return itemBaId !== baIdValid && ov > 0
                })
            itemsHideZero = [...(uplineItem ? [uplineItem] : []), ...itemsHideZero]
            res.genealogy.itemsHideZero = itemsHideZero


            let itemsSortOVwithHideZero = JSON.parse(JSON.stringify(originItems))
                .filter(r => {
                    const itemBaId = getBaId(r)
                    const ov = getPrevMonthOv(r)
                    return itemBaId !== baIdValid && ov > 0
                })
                .sort((r1, r2) => {
                    const ovR1 = getPrevMonthOv(r1)
                    const ovR2 = getPrevMonthOv(r2)
                    return ovR1 > ovR2 ? -1 : ovR1 < ovR2 ? 1 : 0
                })
            itemsSortOVwithHideZero = [...(uplineItem ? [uplineItem] : []), ...itemsSortOVwithHideZero]
            res.genealogy.itemsSortOVwithHideZero = itemsSortOVwithHideZero
        }

        const data = JSON.stringify(res)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}
