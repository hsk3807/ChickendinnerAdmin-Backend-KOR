
const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const countryService = require('../services/countryService')

const getCountry = async e => {
    try {
        // let result = await countryService.countrySelect()
        // let bg = await countryService.backgroundImageCountrySelect()

        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelect(),
            countryService.backgroundImageCountrySelect()
        ])


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
        // let result = await countryService.countrySelectExpress()
        // let bg = await countryService.backgroundImageCountrySelectExpress()
        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelectExpress(),
            countryService.backgroundImageCountrySelectExpress()
        ])
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
        // let result = countryService.countrySelect()
        // let bg = countryService.backgroundImageCountrySelect()
        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelect(),
            countryService.backgroundImageCountrySelect()
        ])

        let country = []
        let bg_img = JSON.parse(bg)
        const source_origin = e.headers.origin
        let b = true
        let icon = JSON.parse(bg_img[2].url)
        let logo = JSON.parse(bg_img[3].url)
        let title = JSON.parse(bg_img[4].url)
        result.forEach((element) => {
            if (element.enable) {
                if (source_origin === 'http://localhost:3000') {
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
                            text: element.text
                        }
                    })
                } else {
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
                            }
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
                            }
                        })
                    }
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
    let country = JSON.parse(e.body)
    let country_json = JSON.stringify(country.data)
    let bg_json = country.bg
    let icon_json = JSON.stringify(country.icon)
    let logo_json = JSON.stringify(country.logo)
    let title_json = JSON.stringify(country.title)

    let data = await countryService.upDateCountry(country_json)
    await countryService.updateBgImage(bg_json, icon_json, logo_json, title_json)
    return createResponse(httpStatus.ok, { message: data })
}

const CountryEditExpress = async (e) => {
    let country = JSON.parse(e.body)
    let country_json = JSON.stringify(country.data)
    let bg_json = country.bg
    let icon_json = JSON.stringify(country.icon)
    let logo_json = JSON.stringify(country.logo)
    let title_json = JSON.stringify(country.title)

    let data = await countryService.upDateCountryExpress(country_json)
    await countryService.updateBgImageExpress(bg_json, icon_json, logo_json, title_json)

    return createResponse(httpStatus.ok, { message: data })
}

const getCountry_filterExpress = async e => {
    try {
        // let result = await countryService.countrySelectExpress()
        // let bg = await countryService.backgroundImageCountrySelectExpress()
        let [
            result,
            bg
        ] = await Promise.all([
            countryService.countrySelectExpress(),
            countryService.backgroundImageCountrySelectExpress()
        ])
        let country = []
        let bg_img = JSON.parse(bg)
        const source_origin = e.headers.origin
        let b = true
        let icon = JSON.parse(bg_img[2].url)
        let logo = JSON.parse(bg_img[3].url)
        let title = JSON.parse(bg_img[4].url)
        // const country = result.map((element) => {
        //     if (element.enable) {
        //         // if (source_origin === 'http://localhost:3000') {
        //         //     return {
        //         //         country: element.country,
        //         //         roman_name: element.roman_name,
        //         //         native_name: element.native_name,
        //         //         test: element.test,
        //         //         live: element.live,
        //         //         short: element.short,
        //         //         shorter: element.shorter,
        //         //         maintenance_mode: {
        //         //             maintenance_mode: false,
        //         //             text: element.text
        //         //         }
        //         //     }
        //         // } else {
        //         b = element.maintenance.find(b => b === source_origin)
        //         if (b) {
        //             delete element.maintenance
        //             return {
        //                 country: element.country,
        //                 roman_name: element.roman_name,
        //                 native_name: element.native_name,
        //                 test: element.test,
        //                 live: element.live,
        //                 short: element.short,
        //                 shorter: element.shorter,
        //                 maintenance_mode: {
        //                     maintenance_mode: true,
        //                     text: element.text
        //                 }
        //             }
        //         } else {
        //             return {
        //                 country: element.country,
        //                 roman_name: element.roman_name,
        //                 native_name: element.native_name,
        //                 test: element.test,
        //                 live: element.live,
        //                 short: element.short,
        //                 shorter: element.shorter,
        //                 maintenance_mode: {
        //                     maintenance_mode: false,
        //                     // text : element.text
        //                 }
        //             }
        //         }
        //         // }
        //     }
        // })

        result.forEach((element) => {
            if (element.enable) {
                // if (source_origin === 'http://localhost:3000') {
                //     delete element.maintenance
                //     country.push({
                //         country: element.country,
                //         roman_name: element.roman_name,
                //         native_name: element.native_name,
                //         test: element.test,
                //         live: element.live,
                //         short: element.short,
                //         shorter: element.shorter,
                //         maintenance_mode: {
                //             maintenance_mode: false,
                //             text: element.text
                //         }
                //     })
                // } else {
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
                        }
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
                        }
                    })
                }
                // }
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


module.exports = {
    getCountry,
    CountryEdit,
    getCountry_filter,
    getCountryExpress,
    CountryEditExpress,
    getCountry_filterExpress
}