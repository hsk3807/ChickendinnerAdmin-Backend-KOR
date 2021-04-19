'use strict'

const _ = require('lodash')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)

const Response = require('./helper/response')
const Promotion = require('./helper/promotion')
const { getShipToCountry, getMarket } = require('./helper/postData')
const countryHelper = require('./helper/country')

const logger = require('./helper/log')

module.exports.main = async (event, context, callback) => {
    logger.silly('=================================================')
    const Hydra = require('./local-lib/hydra')(event, context)
    const NonHydra = require('./local-lib/non-hydra')(event, context)
    const Common = require('./local-lib/common')(event, context)

    try {
        const postData = JSON.parse(event.body)
        if (_.isEmpty(postData) || !_.isObject(postData)) {
            return responseEmptyObj()
        }
        const dict = await NonHydra.getDictionary([Common.getLanguage()])
        if (!postData.hasOwnProperty('order')) {
            return responseEmptyObj()
        }
        if (!postData.order.hasOwnProperty('customer')) {
            return responseEmptyCustomerObj()
        }
        if (
            !postData.order.hasOwnProperty('lines') ||
            !postData.order.lines.hasOwnProperty('items')
        ) {
            return responseEmptyItemObj()
        }
        if (
            !postData.order.hasOwnProperty('shippingMethod') ||
            _.isEmpty(postData.order.shippingMethod)
        ) {
            return responseEmptyShippingMethodsObj()
        }
        if (
            !postData.order.hasOwnProperty('shipToAddress') ||
            !postData.order.shipToAddress.hasOwnProperty('country')
        ) {
            return responseEmptyShipToCountryObj()
        }
        updateHydraDomain(postData)

        let result = await Hydra.orderCalc(postData)
        if (!_.isObject(result)) {
            return Common.responseErrorMessages(['Internal Server Error'], 500)
        }
        if (_.isObject(result) && result.hasOwnProperty('error')) {
            return Common.responseErrorMessages(
                [
                    translateHydraError(
                        result.error.error_message || result.error.message,
                        dict
                    ),
                ],
                result.error.code,
                result.log_id
            )
        }
        Promotion.handler(postData, result)
        if (postData.needReCalculation) {
            logger.silly('<<needReCalculation>>')
            const prev = result
            result = await Hydra.orderCalc(postData)
            result._prev = prev
        }
        // result.items[0].terms.total = 99999999 // test override.
        result.warning = []
        addAramexWarning(postData, result)
        await addBackOrderWarningUsingProductV2(postData, result)

        return Common.responseSuccess(result)
    } catch (error) {
        console.log('index.js try-error', error, error.stack)
        return Common.responseErrorMessages([error.message], 500)
    }
    // =========================================
    function responseEmptyObj() {
        return Common.responseErrorMessages(
            ['Bad Request: `order` is required.'],
            400
        )
    }
    function responseEmptyCustomerObj() {
        return Common.responseErrorMessages(
            ['Invalid customers-resource Error#C3B6P'],
            400
        )
    }
    function responseEmptyItemObj() {
        return Common.responseErrorMessages(['No items Error#K3C7G'], 400)
    }
    function responseEmptyShippingMethodsObj() {
        return Common.responseErrorMessages(
            ['Shipping method not found Error#T7G7W'],
            404
        )
    }
    function responseEmptyShipToCountryObj() {
        return Common.responseErrorMessages(
            ['Shipping method not found Error#X7B7H'],
            404
        )
    }
    function updateOrderCustomerHref(href) {
        const token = href.split('=')
        if (href.indexOf('unicity=') !== -1) {
            return `${Hydra.getHydraDomain()}/customers?unicity=${token[1]}`
        } else if (href.indexOf('type=') !== -1) {
            return `${Hydra.getHydraDomain()}/customers?type=${token[1]}`
        } else {
            return href
        }
    }
    function updateHydraDomain(postData) {
        const hydraDomain = Hydra.getHydraDomain()
        postData.order.customer.href = updateOrderCustomerHref(
            postData.order.customer.href
        )

        postData.order.lines.items = postData.order.lines.items.map((each) => {
            const token = each.item.href.split('=')
            each.item.href = `${hydraDomain}/items?id.unicity=${token[1]}`
            return each
        })

        const shippingMethodToken = postData.order.shippingMethod.href.split(
            '?'
        )
        postData.order.shippingMethod.href = `${hydraDomain}/shippingmethods?${shippingMethodToken[1]}`
    }
    function getSubtotal(result) {
        return result.items[0].terms.subtotal
    }
    function getTotalPv(result) {
        return result.items[0].terms.pv
    }
    function getShippingMethod(postData) {
        const shippingMethodHref = postData.order.shippingMethod.href
        const checkType = shippingMethodHref.match(/(.*)type=(\w+)$/)
        if (_.isArray(checkType) && checkType.length > 1) {
            return [checkType[2], null]
        }
        const checkTypeAndLocation = shippingMethodHref.match(
            /(.*)type=(\w+)&location=(\w+)$/
        )
        if (
            _.isArray(checkTypeAndLocation) &&
            checkTypeAndLocation.length > 2
        ) {
            return [checkTypeAndLocation[2], checkTypeAndLocation[3]]
        }
        return [null, null]
    }
    function isAramex(postData) {
        const [shipType, shipLocation] = getShippingMethod(postData)
        return shipType === 'Aramex'
    }
    function getItemCodes(postData) {
        return postData.order.lines.items.reduce((carry, each) => {
            const itemCode = each.item.href.split('=')[1]
            carry.push(itemCode)
            return carry
        }, [])
    }
    function getItemCodesAndQty(postData) {
        return postData.order.lines.items.reduce((carry, each) => {
            const itemCode = each.item.href.split('=')[1]
            const qty = parseInt(each.quantity)
            carry.push({ itemCode, qty })
            return carry
        }, [])
    }
    function addAramexWarning(postData, hydraResult) {
        const market = getMarket(postData)
        const shipToCountry = getShipToCountry(postData)
        const totalPv = getTotalPv(hydraResult)
        if (
            market === 'SG' &&
            shipToCountry === 'SG' &&
            totalPv > 250 &&
            isAramex(postData)
        ) {
            Response.addWarning(hydraResult, 'message', 'warning_pv_exceed')
        }
    }
    async function addBackOrderWarningUsingProductV2(postData, hydraResult) {
        const market = getMarket(postData)
        const shipToCountry = getShipToCountry(postData)
        const countryCode3 = countryHelper.getCountryCode3(
            market,
            shipToCountry
        )
        if (_.isEmpty(countryCode3)) return
        const itemCodes = getItemCodes(postData)
        const itemCodesAndQty = getItemCodesAndQty(postData)
        const products = await NonHydra.getProducts(
            countryCode3,
            'A',
            itemCodes,
            getWarehouseName(postData)
        )
        const backOrders = products.reduce((carry, each) => {
            const found = itemCodesAndQty.find(
                (item) => item.itemCode === each.item_code
            )
            if (
                true &&
                found &&
                ((found.qty > each.qty_sellable &&
                    each.enable_allowbackorder === 1) ||
                    each.status === 'backorder')
            ) {
                carry.push(each)
            }
            return carry
        }, [])
        if (backOrders.length > 0) {
            Response.addWarning(
                hydraResult,
                'array',
                'warning_has_backorder',
                backOrders
            )
        }
        if (Common.getQueryStringValue('debug') === 'true') {
            hydraResult.products = products
        }
    }
    function translateHydraError(hydraMessage, dict) {
        const lang = Common.getLanguage()
        if (
            'string' === typeof hydraMessage &&
            hydraMessage.indexOf('No items Error') !== -1
        ) {
            return _.isEmpty(dict[lang]['u_all_hydra_error_bad_request'])
                ? dict['EN']['u_all_hydra_error_bad_request']
                : dict[lang]['u_all_hydra_error_bad_request']
        } else {
            return hydraMessage
        }
    }
    function getWarehouseName(postData) {
        const shipToCountry = getShipToCountry(postData)
        if (shipToCountry !== 'ID') return null
        if (true && postData.order.selected_warehouse) {
            return postData.order.selected_warehouse
        }
        if (true && postData.uShopData && postData.uShopData.selectedWarehouse) {
            return postData.uShopData.selectedWarehouse
        }
        if (
            true &&
            postData.order.shippingMethod &&
            postData.order.shippingMethod.href
        ) {
            return postData.order.shippingMethod.href.split('location=')[1]
        }
    }
}
