const { sitesConfig, mappingStatusList } = require("lib-global-configs")
const { tokenGenerator } = require("lib-utils")
const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const UserService = require("../services/userService")
const MenuService = require("../services/menuService")
const SettingsService = require("../services/settingsService")
const EtlGenealogyServices = require("../services/etlGenealogyServices")
const GetEtlOnSelf = require("../functions/etl/getOnself")

const getBaId = body => {
    const { value } = body || {}
    const buff = new Buffer(value, 'base64')
    const [baId] = buff.toString().split(":")
    return baId
}

const getRank = onSelf => {
    const { profile } = onSelf || {}
    const { metricsProfileHistory } = profile || {}
    const { aggregate } = metricsProfileHistory || {}
    const { cumulativeMetricsProfile } = aggregate || {}
    const { highestRankShort } = cumulativeMetricsProfile || {}
    return highestRankShort || null
}

const getStatusItem = onSelf => {
    const { profile } = onSelf || {}
    const { type, status } = profile || {}
    const foundItem = mappingStatusList.find(r => r.type === type && r.status === status)
    return foundItem
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

const getMemberExpireDate = onSelf => {
    const { profile } = onSelf || {}
    const { subscriptions } = profile || {}
    const [firstItem] = subscriptions || []
    const { endDate } = firstItem || {}
    return endDate || null
}

module.exports.handler = async e => {
    try {
        const body = parseBodyJSON(e.body)
        const {
            countryCode = null,
            isMockup ,
            ...queryStringParams
        } = e.queryStringParameters || {}

        const { error: errorValidateCountryCode, value: { countryCode: countryCodeValid } } = validateInput({ countryCode }, GeneralSchema.COUNTRY_OBJECT)
        if (errorValidateCountryCode) return createResponse(httpStatus.badRequest, { message: errorValidateCountryCode.message })

        const [
            loginResult,
            settingsResult = {},
        ] = await Promise.all([
            UserService.loginTokens(body, queryStringParams),
            SettingsService.invokeGetByCountry({countryCode}),
        ])

        const hydraToken = `Bearer ${loginResult.token}`
        const baId = getBaId(body)
        const token = tokenGenerator.create(baId)

        const onselfResponse = await GetEtlOnSelf.handler({
            headers: { "authorization-hydra": hydraToken },
            queryStringParameters: { 
                baId, 
                token, 
                byPassCache: "1", 
                ushopCountryCode: countryCodeValid,
                isMockup ,
            }
        })
        
        const onSelf = JSON.parse(onselfResponse.body)
        if (onselfResponse.statusCode !== 200) return createResponse(
            httpStatus.InternalSersverError,
            {
                message: "Get Onself Error.",
                error: onSelf,
            }
        )

        const rank = getRank(onSelf)
        const statusItem = getStatusItem(onSelf)
        const { code: status = null } = statusItem || {}
        const showtimeDate = getMemberExpireDate(onSelf)
        const userCountry = getUserCountry(onSelf)
        const {
            allowOnlyStatus = [],
            allowOnlyMarket = [],
            disallowOnlyMarket = [],
        } = settingsResult.login || {}

        // Check user disallowOnlyMarket
        if (disallowOnlyMarket.length > 0 && disallowOnlyMarket.includes(userCountry)) return createResponse(
            httpStatus.unauthorized, 
            { message: `Disallow ${userCountry} User.` 
        })

        // Check user disallowOnlyMarket
        if (allowOnlyMarket.length > 0 && !allowOnlyMarket.includes(userCountry)) return createResponse(
            httpStatus.unauthorized, 
            { message: `Allow only ${allowOnlyMarket.join(", ")} User.` 
        })

        // Check user allowOnlyStatus
        if (allowOnlyStatus.length > 0 && !allowOnlyStatus.includes(status)) return createResponse(
            httpStatus.unauthorized, 
            { message: `Allow only ${allowOnlyStatus.join(", ")} Status.` 
        })
       
        const menu = await MenuService.invokeGetPublishMenu({
            countryCode: countryCodeValid,
            baId,
            token,
            rank,
            status,
            showtimeDate,
            userCountry,
        })

        if (menu && Array.isArray(menu.mobile)) {
            const foundGenealogyMenu = menu.mobile.find(r => r.menuKey === "genealogy")
            if (foundGenealogyMenu) {
                await EtlGenealogyServices.invokePrepareCache({
                    headers: { "authorization-hydra": hydraToken },
                    queryStringParameters: { baId, token, byPassCache: true }
                })
            }
        }

        const data = JSON.stringify({
            userCountry,
            userStatus: status,
            conditions: {
                allowOnlyStatus,
                allowOnlyMarket,
                disallowOnlyMarket,
            },
            ...loginResult,
            onSelf,
            menu,
        })

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        const { isAxiosError = false } = err
        console.error(err)
        return isAxiosError
            ? createResponse(err.response.status, { ...err.response.data })
            : createResponse(httpStatus.InternalServerError, { message: err.message, error: err })

    }
}