const deepEqual = require('fast-deep-equal')
const { mappingStatusList } = require("lib-global-configs")

const getUshopDistStatus = genealogyItem => {
    const { status, type } = genealogyItem.customer || {}
    const foundItem = mappingStatusList.find(r => r.status === status && r.type === type)
    const { code: ushopDistStatus } = foundItem || {}
    return ushopDistStatus
}   

const toDistinctOrder = (list, r) => {
    const { currency, ...compare } = r
    const foundItem = list.find(({ currency, ...it }) => deepEqual(it, compare))
    return foundItem ? list : [...list, r]
}

const toEtlGenealogyItem = (genealogyItem) => {
    const element = { ...genealogyItem }

    delete element.customer.humanName.firstName
    delete element.customer.humanName.lastName
    let etlPhone = ""
    let newSub = undefined
    if (element.customer.mobilePhone) {
        etlPhone = element.customer.mobilePhone
    } else if (element.customer.workPhone) {
        etlPhone = element.customer.workPhone
    } else {
        etlPhone = element.customer.homePhone
    }
    if (element.customer.subscriptions) {
        newSub = element.customer.subscriptions.map((ele) => ({
            endDate: ele.endDate,
        }))
    }

    const ushopDistStatus = getUshopDistStatus(genealogyItem) 
    
    return {
        ushopDistStatus,
        customer: {
            // mobilePhone: element.customer.mobilePhone,
            // workPhone: element.customer.workPhone,
            // homePhone: element.customer.homePhone,

            // rights: { ...element.customer.rights },
            // type: element.customer.type,
            ...element.customer,
            etlPhone: etlPhone,
            // href: element.customer.href,
            // sponsoredCustomers: { ...element.customer.sponsoredCustomers },
            // achievementHistory: {
            //     ...element.customer.achievementHistory,
            // },

            // // checkphone: {
            // //     mobilePhone: element.customer.mobilePhone,
            // //     workPhone: element.customer.workPhone,
            // //     homePhone: element.customer.homePhone,
            // // },

            // mainAddress: {
            //     country: element.customer.mainAddress.country,
            // },
            // cumulativeMetricsProfile: {
            //     ...element.customer.cumulativeMetricsProfile,
            // },
            // metricsProfile: {
            //     ...element.customer.metricsProfile,
            // },
            // humanName: {
            //     ...element.customer.humanName,
            // },
            // unicity: element.customer.unicity,
            // id: {
            //     unicity: element.customer.id.unicity,
            // },
            // metricsProfileHistory: {
            //     items: [...element.customer.metricsProfileHistory.items],
            // },

            // profilePicture: {
            //     sizes: [...element.customer.profilePicture.sizes],
            // },
            // email: element.customer.email,
            // sponsor: {
            //     ...element.customer.sponsor,
            // },
            // status: element.customer.status,
            // enroller: {
            //     ...element.customer.enroller,
            // },
            // joinDate: element.customer.joinDate,
            // subscriptions: newSub,
        },
        treeDepth: element.treeDepth,
    }
}

const toEtlOrderHistoryItem = (orderHistoryItem) => {
    const element = { ...orderHistoryItem }
    let etlStatus
    if (element.fulfillmentStatus === 'Fulfilled') {
        etlStatus = 4
    } else if (element.fulfillmentStatus === 'UnFulfilled') {
        etlStatus = 2
    } else {
        etlStatus = 1
    }

    return {
        ...element,
        ushopStatus: etlStatus,
        // currency: element.currency,
        // // fulfillmentStatus: element.fulfillmentStatus,
        // shipToName: {
        //     fullName: element.shipToName.fullName,
        // },
        // customer: {
        //     humanName: {
        //         fullName: element.customer.humanName.fullName,
        //     },
        // },
        // id: {
        //     unicity: element.id.unicity,
        // },
        // terms: {
        //     period: element.terms.period,
        //     total: element.terms.total,
        //     pv: element.terms.pv,
        // },
        // dateCreated: element.dateCreated,
        // href: element.href,
    }
}

const toOrderSortingItem = (val, extend = {}) => {
    return {
        // isRMA: false,
        ...val,
        order: val.id.unicity,
        ushopStatus: val.ushopStatus,
        // dateCreated: val.dateCreated,
        // href: val.href,
        // shipToName: val.shipToName.fullName,
        // customer: val.customer.humanName.fullName,
        terms: {
            ...val.terms,
            ushopCurrencyCode: val.currency,
        },
        // ...extend,
    }
}

const getOrderSorting = (orderItems = [], orderRmasItems = []) => {
    const OrderSorting = orderItems
        .reduce((orders_sorting, val) => {
            let find_val = orders_sorting.find(
                (e) => e.period === val.terms.period
            )
            const sortingItem = toOrderSortingItem(val, { isRMA: false })
            if (!find_val) {
                orders_sorting.push({
                    period: val.terms.period,
                    items: [sortingItem],
                })
            } else {
                const arrayindex = orders_sorting.findIndex(
                    (e) => e.period === val.terms.period
                )
                orders_sorting[arrayindex].items.push(sortingItem)
            }
            return orders_sorting
        }, [])
        .map((order) => ({
            ...order,
            items: order.items.reverse(),
        }))

    const orderSortingWithRmas = orderRmasItems.reverse().reduce(
        (orders_sorting, val) => {
            let find_val = orders_sorting.find(
                (e) => e.period === val.terms.period
            )
            const sortingItem = toOrderSortingItem(val, { isRMA: true })
            if (!find_val) {
                orders_sorting.push({
                    period: val.terms.period,
                    items: [sortingItem],
                })
            } else {
                const arrayindex = orders_sorting.findIndex(
                    (e) => e.period === val.terms.period
                )
                orders_sorting[arrayindex].items.push(sortingItem)
            }
            return orders_sorting
        }, [...OrderSorting])

    return orderSortingWithRmas.sort(
        (a, b) => new Date(b.period) - new Date(a.period)
    )
}

const toEtlSeminarItem = (element) => {
    return {
        ...element,
        // trip_ref: element.trip_ref,
        // trip_info: {
        //     info: {
        //         ...element.trip_info.info,
        //     },
        //     video: {
        //         ...element.trip_info.video,
        //     },
        //     remark: {
        //         ...element.trip_info.remark,
        //     },
        //     trip_ref: element.trip_info.trip_ref,
        //     import_template: element.trip_info.import_template
        // },
        // trip_data: element.trip_data
        //     ? {
        //         months: [...element.trip_data.months],
        //         total_point: element.trip_data.total_point,
        //         is_empty_score: element.trip_data.is_empty_score,
        //         base_rank: element.trip_data.base_rank
        //     } : {}
    }
}

module.exports = {
    toDistinctOrder,
    toEtlGenealogyItem,
    toEtlOrderHistoryItem,
    getOrderSorting,
    toEtlSeminarItem,
}
