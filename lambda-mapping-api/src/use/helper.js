const deepEqual = require('fast-deep-equal')

const toDistinctOrder = (list, r) => {
    const { currency, ...compare } = r
    const foundItem = list.find(({ currency, ...it }) => deepEqual(it, compare))
    return foundItem ? list : [...list, r]
}

const toOrderDetail = (element) => {
    return {
        ...element,
        // catalogSlide: {
        //     content: {
        //         description: element.catalogSlide.content.description
        //     }
        // },
        // item: {
        //     id: {
        //         unicity: element.item.id.unicity
        //     }
        // },
        // quantity: element.quantity,
        // terms: {
        //     priceEach: element.terms.priceEach,
        //     pvEach: element.terms.pvEach,
        //     tax: element.terms.tax,
        //     taxablePriceEach: element.terms.taxablePriceEach
        // }
    }
}


module.exports = {
    toDistinctOrder,
    toOrderDetail
}
