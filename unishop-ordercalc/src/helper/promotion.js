const _ = require('lodash')
const { getShipToCountry, getMarket } = require('../helper/postData')
const {
    getStarterKitItemCode,
    getPromotions,
    getTimezone,
} = require('../helper/country')
const resultHelper = require('../helper/result')
const logger = require('../helper/log')
const dayjs = require('dayjs')

module.exports.handler = function (postData, result = null) {
    const shipToCountry = getShipToCountry(postData)
    const market = getMarket(postData)

    if (!_.isEmpty(result)) doPromotionAfterCalculation()

    // ==========================================
    function isValidConditions(conditions) {
        const checkFns = {
            isOrderTypeMemberOf,
            hasStarterKit,
            isTotalPvGreaterOrEqual,
            orOperator,
            isValidSponsorId,
            isValidPeriod,
        }
        const existFns = Object.keys(checkFns)
        const fnNames = getFnNames(conditions)
        const fnNotExists = fnNames.filter((each) => !existFns.includes(each))
        if (fnNotExists.length !== 0) {
            logger.warn(
                'There are functions not defined: %s',
                fnNotExists.join(',')
            )
            return false
        }

        const invalidCase = conditions.find((each) => {
            if (each.paramType === 'singleValue') {
                return !checkFns[each.fn](each.value)
            } else if (each.paramType === 'array') {
                return !checkFns[each.fn](each.values)
            }
            return false
        })
        logger.silly(
            '<<isValidConditions>> %s (%s)',
            typeof invalidCase !== 'object',
            invalidCase ? invalidCase.fn : null
        )
        if (invalidCase) return false
        return true

        // ==========================================
        function getFnNames(conditions) {
            return conditions.reduce((carry, each) => {
                if (each.hasOwnProperty('fn')) {
                    carry.push(each.fn)
                    if (each.fn === 'orOperator') {
                        carry = carry.concat(each.values.map((item) => item.fn))
                    }
                }
                return carry
            }, [])
        }
        function isOrderTypeMemberOf(values) {
            return (
                false ||
                (postData.orderType && values.includes(postData.orderType)) ||
                (postData.uShopData && postData.uShopData.orderType &&
                    values.includes(postData.uShopData.orderType))
            )
        }
        function hasStarterKit() {
            const starterKitItemCode = getStarterKitItemCode(
                market,
                shipToCountry
            )
            if (_.isEmpty(starterKitItemCode)) return false
            const starterKitItem = resultHelper.getItem(
                result,
                starterKitItemCode
            )
            if (!_.isEmpty(starterKitItem)) return true
            return false
        }
        function isTotalPvGreaterOrEqual(value) {
            return result.items[0].terms.pv >= value
        }
        function orOperator(values) {
            const validCase = values.find((each) => {
                if (each.paramType === 'singleValue') {
                    return checkFns[each.fn](each.value)
                } else if (each.paramType === 'array') {
                    return checkFns[each.fn](each.values)
                }
            })
            return typeof validCase === 'object'
        }
        function isValidPeriod(values) {
            const timezone =
                getTimezone(market, shipToCountry) || dayjs.tz.guess()
            const now = dayjs().tz(timezone).format('YYYY-MM-DD HH:mm:ss')
            logger.silly(
                '<<isValidPeriod>> %s, %s, %s, %s',
                now,
                values[0],
                values[1],
                now >= values[0] && now <= values[1]
            )
            return now >= values[0] && now <= values[1]
        }
        function isValidSponsorId(values) {
            return (
                true &&
                postData.uShopData &&
                postData.uShopData.sponsorId &&
                values.includes(postData.uShopData.sponsorId)
            )
        }
    }

    function doTasks(tasks) {
        const execFn = {
            deductSubTotalPrice,
            deductTotalPrice,
            removeProductItem,
            getStarterKitPrice,
            getStarterKitItemCode: () =>
                getStarterKitItemCode(market, shipToCountry),
            setFlagReCalculation,
        }
        tasks.forEach((each) => {
            if (each.paramType === 'fn') {
                execFn[each.fn](execFn[each.value]())
            } else if (each.paramType === 'void') {
                execFn[each.fn]()
            }
        })
        // ==========================================
        function deductSubTotalPrice(value) {
            result.items[0].terms._hydra_subtotal =
                result.items[0].terms.subtotal
            result.items[0].terms.subtotal -= value
        }
        function deductTotalPrice(value) {
            result.items[0].terms._hydra_total = result.items[0].terms.total
            result.items[0].terms.total -= value
        }
        function removeProductItem(itemCode) {
            result.items[0].lines._hydra_items = result.items[0].lines.items
            result.items[0].lines.items = result.items[0].lines.items.filter(
                (each) => each.item.id.unicity !== itemCode
            )
            postData.order.lines._original_items = postData.order.lines.items
            postData.order.lines.items = postData.order.lines.items.filter(
                (each) => each.item_code !== itemCode
            )
        }
        function getStarterKitPrice() {
            const starterKitItemCode = getStarterKitItemCode(
                market,
                shipToCountry
            )
            const starterKitItem = resultHelper.getItem(
                result,
                starterKitItemCode
            )
            if (_.isEmpty(starterKitItem)) return 0
            return starterKitItem.terms.priceEach
        }
        function setFlagReCalculation() {
            postData.needReCalculation = true
        }
    }

    function doPromotionAfterCalculation() {
        const promotions = getPromotions(market, shipToCountry).filter(
            (each) => each.do === 'afterCalculation'
        )
        logger.silly(
            '<<doPromotionAfterCalculation>> list: ' +
                promotions.map((each) => each.name).join(',') +
                '\n'
        )
        promotions.forEach((each) => {
            if (isValidConditions(each.conditions)) {
                doTasks(each.tasks)
                logger.silly(
                    '<<doPromotionAfterCalculation>> exec: ' + each.name + '\n'
                )
            }
        })
    }
}
