
const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const countryService = require('../services/countryServiceV2')
const PermissionHelpers = require("../utils/permissionHelpers")

const createCountry = async e => {
    try {
        const { Authorization } = e.headers
        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })
        const body = parseBodyJSON(e.body)
        let data
        try {
            await countryService.create(body)
            data = { success: true }
        } catch (e) {
            data = { success: false, message: e.message }
        }
        return createResponse(httpStatus.ok, { data })
    } catch (e) {
        console.error(err)
        const { code, message } = err
        const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
        return createResponse(errStatus, { message })
    }

}

const getCountry = async e => {
    try {
        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelect('ushop'),
            countryService.backgroundImageCountrySelect()
        ])

        result = result.map((element) => {
            const text_english = element.text_english
            const text_native = element.text_native
            delete element.text_english
            delete element.text_native
            element.maintenance = JSON.parse(element.maintenance)
            return {
                ...element,
                text: {
                    english: text_english,
                    native: text_native
                }
            }
        })

        let bg_img = JSON.parse(bg)
        let icon = JSON.parse(bg_img[2].url)
        let logo = JSON.parse(bg_img[3].url)
        let title = JSON.parse(bg_img[4].url)
        const data = {
            data: result,
            bg: {
                bg_desktop: bg_img[0].url,
                bg_mobile: bg_img[1].url
            },
            icon: icon,
            logo: logo,
            title: title,
        }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getCountryExpress = async e => {
    try {
        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelect('express'),
            countryService.backgroundImageCountrySelectExpress()
        ])

        result = result.map((element) => {
            const text_english = element.text_english
            const text_native = element.text_native
            delete element.text_english
            delete element.text_native
            element.maintenance = JSON.parse(element.maintenance)
            return {
                ...element,
                text: {
                    english: text_english,
                    native: text_native
                }
            }
        })

        let bg_img = JSON.parse(bg)
        let icon = JSON.parse(bg_img[2].url)
        let logo = JSON.parse(bg_img[3].url)
        let title = JSON.parse(bg_img[4].url)
        const data = {
            data: result,
            bg: {
                bg_desktop: bg_img[0].url,
                bg_mobile: bg_img[1].url
            },
            icon: icon,
            logo: logo,
            title: title,
        }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getCountry_filter = async e => {
    try {
        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelect('ushop'),
            countryService.backgroundImageCountrySelect()
        ])

        let country = []
        let bg_img = JSON.parse(bg)
        const source_origin = e.headers.origin
        let b = true
        let icon = JSON.parse(bg_img[2].url)
        let logo = JSON.parse(bg_img[3].url)
        let title = JSON.parse(bg_img[4].url)

        result = result.map((element) => {
            const text_english = element.text_english
            const text_native = element.text_native
            delete element.text_english
            delete element.text_native
            element.maintenance = JSON.parse(element.maintenance)
            return {
                ...element,
                text: {
                    english: text_english,
                    native: text_native
                }
            }
        })


        result.forEach((element) => {
            if (element.enable) {
                b = element.maintenance.find(b => b === source_origin)
                if (b) {
                    delete element.maintenance
                    country.push({
                        country: element.country,
                        roman_name: element.roman_name,
                        native_name: element.native_name,
                        test: element.test,
                        live: element.live,
                        short: element.short,
                        shorter: element.shorter,
                        maintenance_mode: {
                            maintenance_mode: true,
                            text: element.text
                        },
                        fsb: element.fsb ? true : false,
                        orderHistoryDownline: element.orderHistoryDownline ? true : false
                    })

                } else {
                    delete element.maintenance
                    country.push({
                        country: element.country,
                        roman_name: element.roman_name,
                        native_name: element.native_name,
                        test: element.test,
                        live: element.live,
                        short: element.short,
                        shorter: element.shorter,
                        maintenance_mode: {
                            maintenance_mode: false,
                            // text : element.text
                        },
                        fsb: element.fsb ? true : false,
                        orderHistoryDownline: element.orderHistoryDownline ? true : false
                    })
                }
            }
        })

        const data = {
            success: true,
            bg_img: {
                desktop: bg_img[0].url,
                mobile: bg_img[1].url
            },
            icon: icon,
            logo: logo,
            title: title,
            data: country
        }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}


const CountryEdit = async (e) => {
    // Check full access
    const { Authorization } = e.headers

    const decodedData = PermissionHelpers.getDecodeToken(Authorization)
    const { isFullAccess } = decodedData
    if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })


    let country = JSON.parse(e.body)
    const input = Array.isArray(country.data) ? country.data : [country.data]

    const noEditDataList = input.filter(({ id, ...cols }) => Object.keys(cols).length < 1)
    if (noEditDataList.length > 0) return createResponse(
        httpStatus.badRequest,
        { message: "At least 1 edit data.", error: { data: noEditDataList } }
    )

    const existsData = await countryService.countrySelect('ushop')
    const listOfExistId = existsData.map(r => r.id)
    const notFoundData = input.filter(r => !listOfExistId.includes(r.id))
    if (notFoundData.length > 0) return createResponse(
        httpStatus.notFound,
        { message: "NotFound.", error: { data: notFoundData.map(r => r.id) } }
    )

    let bg_json = country.bg
    let icon_json = JSON.stringify(country.icon)
    let logo_json = JSON.stringify(country.logo)
    let title_json = JSON.stringify(country.title)

    let data = await countryService.upDateCountry(input)
    await countryService.updateBgImage(bg_json, icon_json, logo_json, title_json)
    return createResponse(httpStatus.ok, { message: data })
}

const CountryEditExpress = async (e) => {
    const { Authorization } = e.headers

    const decodedData = PermissionHelpers.getDecodeToken(Authorization)
    const { isFullAccess } = decodedData
    if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })


    let country = JSON.parse(e.body)
    const input = Array.isArray(country.data) ? country.data : [country.data]

    const noEditDataList = input.filter(({ id, ...cols }) => Object.keys(cols).length < 1)
    if (noEditDataList.length > 0) return createResponse(
        httpStatus.badRequest,
        { message: "At least 1 edit data.", error: { data: noEditDataList } }
    )

    const existsData = await countryService.countrySelect('express')
    const listOfExistId = existsData.map(r => r.id)
    const notFoundData = input.filter(r => !listOfExistId.includes(r.id))
    if (notFoundData.length > 0) return createResponse(
        httpStatus.notFound,
        { message: "NotFound.", error: { data: notFoundData.map(r => r.id) } }
    )

    let bg_json = country.bg
    let icon_json = JSON.stringify(country.icon)
    let logo_json = JSON.stringify(country.logo)
    let title_json = JSON.stringify(country.title)

    let data = await countryService.upDateCountry(input)
    await countryService.updateBgImageExpress(bg_json, icon_json, logo_json, title_json)

    return createResponse(httpStatus.ok, { message: data })
}

const getCountry_filterExpress = async e => {
    try {
        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelect('express'),
            countryService.backgroundImageCountrySelectExpress()
        ])
        let country = []
        let bg_img = JSON.parse(bg)
        const source_origin = e.headers.origin
        let b = true
        let icon = JSON.parse(bg_img[2].url)
        let logo = JSON.parse(bg_img[3].url)
        let title = JSON.parse(bg_img[4].url)


        result = result.map((element) => {
            const text_english = element.text_english
            const text_native = element.text_native
            delete element.text_english
            delete element.text_native
            element.maintenance = JSON.parse(element.maintenance)
            return {
                ...element,
                text: {
                    english: text_english,
                    native: text_native
                }
            }
        })

        result.forEach((element) => {
            if (element.enable) {
                b = element.maintenance.find(b => b === source_origin)
                if (b) {
                    delete element.maintenance
                    country.push({
                        country: element.country,
                        roman_name: element.roman_name,
                        native_name: element.native_name,
                        test: element.test,
                        live: element.live,
                        short: element.short,
                        shorter: element.shorter,
                        maintenance_mode: {
                            maintenance_mode: true,
                            text: element.text
                        },
                        fsb: element.fsb ? true : false,
                        orderHistoryDownline: element.orderHistoryDownline ? true : false
                    })

                } else {
                    delete element.maintenance
                    country.push({
                        country: element.country,
                        roman_name: element.roman_name,
                        native_name: element.native_name,
                        test: element.test,
                        live: element.live,
                        short: element.short,
                        shorter: element.shorter,
                        maintenance_mode: {
                            maintenance_mode: false,
                            // text : element.text
                        },
                        fsb: element.fsb ? true : false,
                        orderHistoryDownline: element.orderHistoryDownline ? true : false

                    })
                }
            }
        })

        const data = {
            success: true,
            bg_img: {
                desktop: bg_img[0].url,
                mobile: bg_img[1].url
            },
            icon: icon,
            logo: logo,
            title: title,
            data: country
        }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const deleteOne = async e => {
    try {
        const { Authorization } = e.headers
        const { id } = e.pathParameters || {}

        // Check full access
        const decodedData = PermissionHelpers.getDecodeToken(Authorization)
        const { isFullAccess } = decodedData
        if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

        const { affectedRows } = await countryService.deleteById(id)
        return affectedRows
            ? createResponse(httpStatus.ok, { data: affectedRows })
            : createResponse(httpStatus.notFound, { message: "NotFound." })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}


module.exports = {
    createCountry,
    getCountry,
    CountryEdit,
    getCountry_filter,
    getCountryExpress,
    CountryEditExpress,
    getCountry_filterExpress,
    deleteOne
}