const { httpStatus, sitesConfig, mappingStatusList } = require("lib-global-configs")
const { utilsHelper, tokenGenerator } = require("lib-utils")
const { createResponse, createErrorResponse, validateInput, parseBodyJSON, formatErrorController } = utilsHelper
const EtlSchema = require("../schema/etlSchema")
const EtlHelper = require("../utils/etlHelper")
const EtlService = require("../services/etlService")
const HydraService = require("../services/hydraService")
const SettingsService = require("../services/settingsService")
const MenuService = require("../services/menuService")
const QuotesService = require("../services/quotesService")
const PopupService = require("../services/popupService")
const EtlCacheService = require("../services/etlCacheService")
const etlConfigService = require("../services/etlConfigService")
const EtlInvokeService = require("../services/etlInvokeService")

const toError = (name, err) => formatErrorController(`etlController-${name}`, err)

const logger = {
    request: e => console.info(`[REQUEST]\n${JSON.stringify(e, null, 2)}`),
    time: (name, e) => console.time(`[TIME] ${name}\n${JSON.stringify(e, null, 2)}`),
    timeEnd: (name, e) => console.timeEnd(`[TIME] ${name}\n${JSON.stringify(e, null, 2)}`),
}

const getBaId = body => {
    const { value } = body || {}
    const buff = new Buffer(value, 'base64')
    const [baId] = buff.toString().split(":")
    return baId
}

const getUserCountry = onSelf => {
    const { profile } = onSelf || {}
    const { mainAddress } = profile || {}
    const { country } = mainAddress || {}
    const userCountry = Object.keys(sitesConfig)
        .find(key => {
            const { countryCode } = sitesConfig[key]
            return country === countryCode.alpha2
        })
    return userCountry || null
}

const getUserStatus = onSelf => {
    const { profile } = onSelf || {}
    const { type, status } = profile || {}
    const foundItem = mappingStatusList.find(r => r.type === type && r.status === status)
    const { code = null } = foundItem || {}
    return code
}

const getUserRank = onSelf => {
    const { profile } = onSelf || {}
    const { metricsProfileHistory } = profile || {}
    const { aggregate } = metricsProfileHistory || {}
    const { cumulativeMetricsProfile } = aggregate || {}
    const { highestRankShort } = cumulativeMetricsProfile || {}
    return highestRankShort || null
}

const getMemberExpireDate = onSelf => {
    const { profile } = onSelf || {}
    const { subscriptions } = profile || {}
    const [firstItem] = subscriptions || []
    const { endDate } = firstItem || {}
    return endDate || null
}

const checkAllowUser = ({
    settingsResult,
    userCountry,
    userStatus,
}) => {
    const {
        disallowOnlyMarket = [],
        allowOnlyStatus = [],
        allowOnlyMarket = [],
    } = settingsResult.login || {}

    // Check user disallowOnlyMarket
    if (disallowOnlyMarket.length > 0 && disallowOnlyMarket.includes(userCountry)) throw {
        httpStatus: httpStatus.unauthorized,
        message: `Disallow ${userCountry} User.` ,
    }

    // Check user disallowOnlyMarket
    if (allowOnlyMarket.length > 0 && !allowOnlyMarket.includes(userCountry)) throw {
        httpStatus: httpStatus.unauthorized, 
        message: `Allow only ${allowOnlyMarket.join(", ")} User.`,
    }

    // Check user allowOnlyStatus
    if (allowOnlyStatus.length > 0 && !allowOnlyStatus.includes(userStatus)) throw {
        httpStatus: httpStatus.unauthorized,
        message: `Allow only ${allowOnlyStatus.join(", ")} Status.`,
    }
}

const checkCacheUsage = ({
    cacheData,
    cacheExpireMinutes,
    byPassCache,
}) => {
    const now = new Date().toISOString()
    const cacheDurationsMinutes = cacheData 
        ? Math.round(((new Date(now) - new Date(cacheData.updatedAt)) / 1000) / 60) 
        : null
    const isCacheUsage = cacheData && !isNaN(cacheDurationsMinutes) && !byPassCache
        ? cacheDurationsMinutes < cacheExpireMinutes 
        : false
    return isCacheUsage
}

const fetchAsyncGenealogyByMenu = async ({
    etlConfigs,
    menu,
    tokenHydra,
    baId,
    token,
    ushopCountryCode,
}) => {
    try{
        const { 
            cacheEnable,
            autoFetchEnable, 
            autoFetchIsStoreCache, 
            autoFetchAfterLogin,
        } = etlConfigs || {}

        const isStoreCache = cacheEnable && autoFetchIsStoreCache
        const isAutoFetchOn = autoFetchEnable 
            && autoFetchAfterLogin

        if (isAutoFetchOn){
            const isFoundGenealogyMenu = menu.desktop.findIndex(m => m.menuKey === "genealogy") > -1
            if (isFoundGenealogyMenu){
                if (isStoreCache){
                    const invokeParams = {
                        tokenHydra,
                        baId,
                        token,
                        ushopCountryCode,
                        byPassCache: 1,
                    }
                    logger.time(`[GET: ByMenu] Genealogy`, invokeParams)
                    await EtlInvokeService.invokeGetGenealogy(invokeParams)
                    logger.timeEnd(`[GET: ByMenu] Genealogy`, invokeParams)
                }else{
                    const invokeParams = {
                        tokenHydra, 
                        baId, 
                        ushopCountryCode,
                    }
                    logger.time(`[FETCH: ByMenu] Genealogy`, invokeParams)
                    await EtlInvokeService.invokeFetchGenealogy(invokeParams)
                    logger.timeEnd(`[FETCH: ByMenu] Genealogy`, invokeParams)
                }
            }
        }
        
    }catch(err){
        console.error(err)
        throw toError("fetchAsyncGenealogyByMenu", err)
    }
}

const fetchAsyncTopOvGenealogy = async ({
    etlConfigs,
    genealogyItems = [],
    tokenHydra,
    ushopCountryCode,
    maxTreeDepth,
    limit,
    periodStart,
    periodEnd,
}) => {
    try{
        const { 
            cacheEnable,
            autoFetchEnable, 
            autoFetchIsStoreCache, 
            autoFetchNumberOfTopOv = 0,
        } = etlConfigs || {}

        const isStoreCache = cacheEnable && autoFetchIsStoreCache
        const isAutoFetchOn = autoFetchEnable 
             && autoFetchNumberOfTopOv > 0 

        if (isAutoFetchOn){
            const topOvItems = genealogyItems
                .filter(r => r.treeDepth)
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
                .sort((r1, r2) => r1.ov > r2.ov ? -1 : r1.ov < r2.ov ? 1 : 0)
                .slice(0, autoFetchNumberOfTopOv)
            
            const topOvRequestParams = topOvItems
                .map(({baId}) => {
                    const token = tokenGenerator.create(baId)
                    return {
                        tokenHydra,
                        baId,
                        token,
                        ushopCountryCode,
                        byPassCache: 1,
                        maxTreeDepth,
                        limit,
                        periodStart,
                        periodEnd,
                        isAutoFetchTopOv: 0,
                    }
                })

            if (isStoreCache){
                logger.time(`[GET: Autofetch] Genealogy`, topOvRequestParams)
                await Promise.all(
                    topOvRequestParams.map(invokeParams => EtlInvokeService.invokeGetGenealogy(invokeParams))
                )
                logger.timeEnd(`[GET: Autofetch] Genealogy`, topOvRequestParams)
            }else{
                logger.time(`[FETCH: Autofetch] Genealogy`, topOvRequestParams)
                await Promise.all(
                    topOvRequestParams.map(invokeParams => EtlInvokeService.invokeFetchGenealogy(invokeParams))
                )
                logger.timeEnd(`[FETCH: Autofetch] Genealogy`, topOvRequestParams)
            }
        }

    }catch(err){
        console.error(err)
        throw toError("fetchAsyncTopOvGenealogy", err)
    }
}

const excuteOnself = async (inputParams = {
    tokenHydra,
    baId,
    token,
    ushopCountryCode,
    collapse,
    byPassCache,
}) => {
    try{
        const { error: errorParams, value: validParams } = validateInput(inputParams, EtlSchema.GET_ETL_BASE)
        if (errorParams) throw {
            httpStatus: httpStatus.badRequest, 
            error:{ message: errorParams.message },
        }
    
        const { 
            tokenHydra,
            baId,
            token,
            ushopCountryCode,
            collapse,
            byPassCache,
        } = validParams
    
        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) throw {
            httpStatus: httpStatus.forbidden, 
            error:{ message: "Invalid token." },
        }

        // check cache usage
        const etlConfigs = await etlConfigService.getOne({ ushopCountryCode })
        const { cacheEnable, cacheExpireMinutes, cacheModuleList = [] } = etlConfigs || {}
        const isCacheOn = cacheEnable && cacheModuleList.includes('onself')
        const cacheData = isCacheOn 
            ? await EtlCacheService.getOnselfCache({ tokenHydra, baId, ushopCountryCode })
            : null
        const isCacheUsage = checkCacheUsage({ cacheData, byPassCache, cacheExpireMinutes })

        // provide data
        const isExpandHydra = !collapse.includes('hydra')
        const isExpandUshop = !collapse.includes('ushop')
        const hydra = (isExpandHydra || isExpandUshop)
            ? isCacheUsage && cacheData
                ? cacheData.hydraCache 
                : await EtlService.getOnself({ tokenHydra, baId, ushopCountryCode }) 
            : undefined
        const ushop = isExpandUshop && hydra
            ? EtlHelper.toEtlOnself(hydra)
            : undefined

        // store cache if has usage
        if (isCacheOn && !isCacheUsage){
            if (cacheData){
                await EtlCacheService.updateOnselfCache({
                    id: cacheData.id,
                    hydraCache: hydra,
                })
            }else{
                await EtlCacheService.createOnselfCache({
                    tokenHydra,
                    baId,
                    ushopCountryCode,
                    hydraCache: hydra,
                })
            }
        }

        // return data
        const data = { 
            cache: isCacheUsage,
            ...(isCacheUsage ? { updatedAt: cacheData.updatedAt } : {}),
            ...(isExpandHydra ? { hydra } : {}),
            ...(isExpandUshop ? { ushop } : {}),
        }
        return data
    }catch(err){
        console.error(err)
        throw err
    }
}

const excuteOrdersHistory = async (inputParams = {
    tokenHydra,
    baId,
    token,
    ushopCountryCode,
    collapse,
    periodStart,
    periodEnd,
    byPassCache,
}) => {
    try{
        const { error: errorParams, value: validParams } = validateInput(inputParams, EtlSchema.GET_ETL_ORDER_HISTORY)
        if (errorParams) throw {
            httpStatus: httpStatus.badRequest, 
            error:{ message: errorParams.message },
        }
    
        const {
            tokenHydra,
            baId,
            token,
            ushopCountryCode,
            collapse,
            byPassCache,
            periodStart,
            periodEnd,
        } = validParams
    
        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) throw {
            httpStatus: httpStatus.forbidden, 
            error:{ message: "Invalid token." },
        }

        // check cache usage
        const etlConfigs = await etlConfigService.getOne({ ushopCountryCode })
        const { cacheEnable, cacheExpireMinutes, cacheModuleList = [] } = etlConfigs || {}
        const isCacheOn = cacheEnable && cacheModuleList.includes('orderHistory')
        const cacheData = isCacheOn 
            ? await EtlCacheService.getOrderHistoryCache({ tokenHydra, baId, periodStart, periodEnd, ushopCountryCode })
            : null
        const isCacheUsage = checkCacheUsage({ cacheData, byPassCache, cacheExpireMinutes })

        // provide data
        const isExpandHydra = !collapse.includes('hydra')
        const isExpandUshop = !collapse.includes('ushop')
        const hydra = (isExpandHydra || isExpandUshop)
            ? isCacheUsage && cacheData
                ? cacheData.hydraCache 
                : await EtlService.getOrdersHistory({ 
                    tokenHydra, 
                    baId, 
                    periodStart, 
                    periodEnd,
                    ushopCountryCode,
                })
            : undefined
        const ushop = isExpandUshop && hydra
            ? EtlHelper.toEtlOrdersHistory(hydra)
            : undefined

        // store cache if has usage
        if (isCacheOn && !isCacheUsage){
            if (cacheData){
                await EtlCacheService.updateOrderHistoryCache({
                    id: cacheData.id,
                    hydraCache: hydra,
                })
            }else{
                await EtlCacheService.createOrderHistoryCache({
                    tokenHydra,
                    baId,
                    periodStart, 
                    periodEnd,
                    ushopCountryCode,
                    hydraCache: hydra,
                })
            }
        }

        // return data
        const data = { 
            cache: isCacheUsage,
            ...(isCacheUsage ? { updatedAt: cacheData.updatedAt } : {}),
            ...(isExpandHydra ? { hydra } : {}),
            ...(isExpandUshop ? { ushop } : {}),
        }
        return data
    }catch(err){
        console.error(err)
        throw err
    }    
}

const excuteGenealogy = async (inputParams = {
    tokenHydra,
    baId,
    token,
    ushopCountryCode,
    collapse,
    byPassCache,
    maxTreeDepth,
    limit,
    periodStart,
    periodEnd,
    isAutoFetchTopOv,
}) => {
    try{
        const { error: errorParams, value: validParams } = validateInput(inputParams, EtlSchema.GET_ETL_GENEALOGY)
        if (errorParams) throw {
            httpStatus: httpStatus.badRequest, 
            error:{ message: errorParams.message },
        }
    
        const { 
            tokenHydra,
            baId,
            token,
            ushopCountryCode,
            collapse,
            byPassCache,
            maxTreeDepth,
            limit,
            periodStart,
            periodEnd,
            isAutoFetchTopOv,
        } = validParams

        const isValidToken = tokenGenerator.validate(baId, token)
        if (!isValidToken) throw {
            httpStatus: httpStatus.forbidden, 
            error:{ message: "Invalid token." },
        }

        // check cache usage
        const etlConfigs = await etlConfigService.getOne({ ushopCountryCode })
        const { cacheEnable, cacheExpireMinutes, cacheModuleList = [] } = etlConfigs || {}
        const isCacheOn = cacheEnable && cacheModuleList.includes('genealogy')
        const cacheData = isCacheOn 
            ? await EtlCacheService.getGenealogyCache({ 
                tokenHydra, 
                baId, 
                ushopCountryCode,
                periodStart,
                periodEnd, 
                maxTreeDepth,
                limitItems: limit,
            })
            : null
        const isCacheUsage = checkCacheUsage({ cacheData, byPassCache, cacheExpireMinutes })

        // provide data
        const isExpandHydra = !collapse.includes('hydra')
        const isExpandUshop = !collapse.includes('ushop')
        const hydra = (isExpandHydra || isExpandUshop)
            ? isCacheUsage && cacheData
                ? cacheData.hydraCache 
                : await EtlService.getGenealogy({ 
                    tokenHydra, 
                    baId, 
                    ushopCountryCode,
                    periodStart, 
                    periodEnd, 
                    maxTreeDepth, 
                    limit, 
                })
            : undefined
        const ushop = isExpandUshop && hydra
            ? EtlHelper.toEtlGenealogy(hydra)
            : undefined

        // store cache if has usage
        if (isCacheOn && !isCacheUsage){
            if (cacheData){
                await EtlCacheService.updateGenealogyCache({
                    id: cacheData.id,
                    hydraCache: hydra,
                })
            }else{
                await EtlCacheService.createGenealogyCache({
                    tokenHydra, 
                    baId, 
                    ushopCountryCode,
                    periodStart,
                    periodEnd, 
                    maxTreeDepth,
                    limitItems: limit,
                    hydraCache: hydra,
                })
            }
        }

        // AutoFetch TopOV
        if (isAutoFetchTopOv){
            await fetchAsyncTopOvGenealogy({
                etlConfigs,
                genealogyItems: hydra.genealogy.items,
                tokenHydra,
                ushopCountryCode,
                maxTreeDepth,
                limit,
                periodStart,
                periodEnd,
            })
        }
        
        
        // return data
        const data = { 
            isAutoFetchTopOv,
            cache: isCacheUsage,
            ...(isCacheUsage ? { updatedAt: cacheData.updatedAt } : {}),
            ...(isExpandHydra ? { hydra } : {}),
            ...(isExpandUshop ? { ushop } : {}),
        }
        return data

    }catch(err){
        console.error(err)
        throw err
    }
}

const getOnself = async e => {
    try{
        console.info(`[REQUEST]\n${JSON.stringify(e, null, 2)}`)
        const { "authorization-hydra": tokenHydra } = e.headers;
        const {
            baId: baIdInput,
            token: tokenInput,
            ushopCountryCode: ushopCountryCodeInput,
            byPassCache: byPassCacheInput,
        } = e.queryStringParameters || {}
        const { collapse: collapseInput } = e.multiValueQueryStringParameters || {}
        
        const data = await excuteOnself({
            tokenHydra,
            baId: baIdInput,
            token: tokenInput,
            ushopCountryCode: ushopCountryCodeInput,
            collapse: collapseInput,
            byPassCache: byPassCacheInput,
        })
        
        return createResponse(httpStatus.ok, { data })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const getOrdersHistory = async e => {
    try{
        const { "authorization-hydra": tokenHydra } = e.headers;
        const {
            baId: baIdInput,
            token: tokenInput,
            ushopCountryCode: ushopCountryCodeInput,
            periodStart: periodStartInput,
            periodEnd: periodEndInput,
            byPassCache: byPassCacheInput,
        } = e.queryStringParameters || {}
        const { collapse: collapseInput } = e.multiValueQueryStringParameters || {}
        
        const data = await excuteOrdersHistory({
            tokenHydra,
            baId: baIdInput,
            token: tokenInput,
            ushopCountryCode: ushopCountryCodeInput,
            collapse: collapseInput,
            byPassCache: byPassCacheInput,
            periodStart: periodStartInput,
            periodEnd: periodEndInput,
        })

        return createResponse(httpStatus.ok, { data })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const getGenealogy = async e => {
    try{
        logger.request(e)
        const { "authorization-hydra": tokenHydra } = e.headers;
        const {
            baId: baIdInput,
            token: tokenInput,
            ushopCountryCode: ushopCountryCodeInput,
            byPassCache: byPassCacheInput,
            periodStart: periodStartInput,
            periodEnd: periodEndInput,
            maxTreeDepth: maxTreeDepthInput,
            limit: limitInput,
            isAutoFetchTopOv: isAutoFetchTopOvInput,
        } = e.queryStringParameters || {}
        const { collapse: collapseInput } = e.multiValueQueryStringParameters || {}
        
        const data = await excuteGenealogy({
            tokenHydra,
            baId: baIdInput,
            token: tokenInput,
            ushopCountryCode: ushopCountryCodeInput,
            collapse: collapseInput,
            byPassCache: byPassCacheInput,
            periodStart: periodStartInput,
            periodEnd: periodEndInput,
            maxTreeDepth: maxTreeDepthInput,
            limit: limitInput, 
            isAutoFetchTopOv: isAutoFetchTopOvInput,
        })

        return createResponse(httpStatus.ok, { data })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const loginTokens = async e => {
    try{
        logger.request(e)
        const body = parseBodyJSON(e.body)
        const { 
            ushopCountryCode: ushopCountryCodeInput,
            byPassCache: byPassCacheInput,
        } = e.queryStringParameters || {}
        const { collapse: collapseInput } = e.multiValueQueryStringParameters || {}

        const inputParams = { 
            ushopCountryCode: ushopCountryCodeInput,
            collapse: collapseInput,
            byPassCache: byPassCacheInput,
        }
        const { error: errorParams, value: validParams } = validateInput(inputParams, EtlSchema.LOGIN_TOKENS)
        if (errorParams) throw {
            httpStatus: httpStatus.badRequest, 
            error:{ message: errorParams.message },
        }
        
        const { ushopCountryCode, collapse } = validParams
        const [
            loginData,
            settingsResult,
            quotes,
            etlConfigs,
        ] = await Promise.all([
            HydraService.loginTokens({ body }),
            SettingsService.invokeGetByOne({ countryCode: ushopCountryCode }),
            QuotesService.getRandomSet({ countryCode: ushopCountryCode }),
            etlConfigService.getOne({ ushopCountryCode }),
        ])

        const tokenHydra = `Bearer ${loginData.token}`
        const baId = getBaId(body)
        const token = tokenGenerator.create(baId)

        const onself = await excuteOnself({
            tokenHydra,
            baId,
            token,
            ushopCountryCode,
            collapse,
        })
        const userCountry = getUserCountry(onself.ushop || onself.hydra)
        const userStatus = getUserStatus(onself.ushop || onself.hydra)
        const userRank = getUserRank(onself.ushop || onself.hydra)
        const userExpire = getMemberExpireDate(onself.ushop || onself.hydra)

        // check user allow
        checkAllowUser({ settingsResult, userCountry, userStatus })
       
        // get popup & menu
        const [
            menu,
            popup,
        ] = await Promise.all([
            MenuService.invokeMenuGetPublish({
                countryCode: ushopCountryCode,
                baId,
                token,
                rank: userRank,
                status: userStatus,
                showtimeDate: userExpire,
                userCountry,
            }),
            PopupService.invokeGetPublishPopUp({
                countryCode: ushopCountryCode,
                baId,
                token,
                status: userStatus,
                userCountry
            }),
        ])

        // trigger autofetch
        await fetchAsyncGenealogyByMenu({
            etlConfigs,
            menu,
            tokenHydra,
            baId,
            token,
            ushopCountryCode,
        })

        // return data
        const data = {
            baId,
            token,
            tokenHydra,
            userCountry,
            userStatus,
            userRank,
            userExpire,
            loginData,
            onself,
            menu: {
                isLogin: true,
                ...menu,
            },
            quotes,
            popup,
        }
        return createResponse(httpStatus.ok, { data })
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const getMenu = async e => {
    try{
        const { "authorization-hydra": tokenHydra } = e.headers
        const {
            ushopCountryCode: ushopCountryCodeInput,
            baId: inputBaId,
            token: inputToken,
            byPassCache: byPassCacheInput,
        } = e.queryStringParameters || {}
        const { collapse: collapseInput } = e.multiValueQueryStringParameters || {}

        const inputParams = { 
            ushopCountryCode: ushopCountryCodeInput,
            tokenHydra,
            baId: inputBaId,
            token: inputToken,
            collapse: collapseInput,
            byPassCache: byPassCacheInput,
        }

        const { error: errorParams, value: validParams } = validateInput(inputParams, EtlSchema.GET_MENU)
        if (errorParams) throw {
            httpStatus: httpStatus.badRequest, 
            error:{ message: errorParams.message },
        }

        const {
            ushopCountryCode,
            baId,
            token,
            collapse,
         } = validParams

        const isLogin = [tokenHydra, baId, token].every(v => !!v)

        if (isLogin){ // With Login
            const [
                onself,
                settingsResult,
                etlConfigs,
            ] = await Promise.all([
                excuteOnself({
                    tokenHydra,
                    baId,
                    token,
                    ushopCountryCode,
                    collapse,
                }),
                SettingsService.invokeGetByOne({ countryCode: ushopCountryCode }),
                etlConfigService.getOne({ ushopCountryCode }),
            ])
            const userCountry = getUserCountry(onself.ushop || onself.hydra)
            const userStatus = getUserStatus(onself.ushop || onself.hydra)
            const userRank = getUserRank(onself.ushop || onself.hydra)
            const userExpire = getMemberExpireDate(onself.ushop || onself.hydra)

            // Check user allow
            checkAllowUser({ settingsResult, userCountry, userStatus })

            // Get PopUp & Menu
            const [
                quotes,
                menu,
                popup,
            ] = await Promise.all([
                QuotesService.getRandomSet({ countryCode: ushopCountryCode }),
                MenuService.invokeMenuGetPublish({
                    countryCode: ushopCountryCode,
                    baId,
                    token,
                    rank: userRank,
                    status: userStatus,
                    showtimeDate: userExpire,
                    userCountry,
                }),
                PopupService.invokeGetPublishPopUp({
                    countryCode: ushopCountryCode,
                    baId,
                    token,
                    status: userStatus,
                    userCountry
                }),
            ])

            // trigger autofetch
            await fetchAsyncGenealogyByMenu({
                etlConfigs,
                menu,
                tokenHydra,
                baId,
                token,
                ushopCountryCode,
            })

            // return data
            const data = {
                baId,
                userCountry,
                userStatus,
                userRank,
                userExpire,
                onself,
                menu: {
                    isLogin,
                    ...menu,
                },
                quotes,
                popup,
            }
            return createResponse(httpStatus.ok, { data })
        }else{ // Without Login
            const [
                menu,
                quotes,
                popup,
            ] = await Promise.all([
                MenuService.invokeMenuGetPublish({ countryCode: ushopCountryCode }),
                QuotesService.getRandomSet({ countryCode: ushopCountryCode }),
                PopupService.invokeGetPublishPopUp({ countryCode: ushopCountryCode })
            ])
            const data = {
                menu: {
                    isLogin,
                    ...menu,
                },
                quotes,
                popup
            }
            return createResponse(httpStatus.ok, { data })
        }
    }catch(err){
        console.error(err)
        return createErrorResponse(err)
    }
}

const fetchGenealogy = async (inputParams = {
    tokenHydra, 
    baId, 
    ushopCountryCode,
    periodStart, 
    periodEnd, 
    maxTreeDepth, 
    limit, 
}) => {
    try{
        logger.request(inputParams)
        return EtlService.getGenealogy(inputParams)
    }catch(err){
        console.error(err)
        throw toError("fetchGenealogy", err)
    }
}

module.exports = {
    loginTokens,
    getMenu,
    excuteOnself,
    excuteOrdersHistory,
    excuteGenealogy,
    getOnself,
    getOrdersHistory,
    getGenealogy,
    fetchGenealogy,
}