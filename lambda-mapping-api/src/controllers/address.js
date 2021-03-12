const { createResponse, parseBodyJSON } = require("../use/createResponse")
const { validateInput } = require("../use/validator")
const GeneralSchema = require("../schema/generalSchema")
const { saveLog } = require("../use/createLog")
const { mappingDataSchema, TWNAddress } = require("../schema/orderSchema")
const { city_taiwan } = require("../listCity/cityTaiwan")

const pickUpAddressTWN = {
    TW: {
        fullName: 'Taiwan, Main Office',
        address1: '基隆路一段141號10樓之4',
        address3: '',
        city: '110台北市信義區',
        country: 'TW',
        zip: ''
    },
    EN: {
        fullName: 'Taiwan, Main Office',
        address1: '基隆路一段141號10樓之4',
        address3: '',
        city: '110台北市信義區',
        country: 'TW',
        zip: ''
    }
}

const findCity = (city_taiwan, city) => {
    let find_city = city_taiwan
    let cityNew
    let zipNew
    let zoneNew
    find_city.forEach(element => {
        let check = city.split(element.city_roman)
        if (check.length > 1) {
            cityNew = element.city_roman
            zipNew = check[0]
            zoneNew = check[1] ? check[1] : ''
            return
        }
    });
    return ({ city: cityNew, zip: zipNew, zone: zoneNew })
}

module.exports.TWNconcatAddress = async (e) => {
    try {
        const body = parseBodyJSON(e.body)
        // const country_code = body.country_code ? body.country_code : 'A'
        // if (country_code) {
        //     const { error: errorValidateCountryCode, value: countryCodeValid } = validateInput(country_code, GeneralSchema.VALID_COUNTRY)
        //     if (errorValidateCountryCode) return createResponse(400, { message: errorValidateCountryCode.message })
        // }
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, mappingDataSchema)
        if (errorValidateBody) return createResponse(400, { message: errorValidateBody.message })

        const { address, city, zone, zip, country } = body.hydra.shipToAddress
        let shipToName

        let shipToAddress
        const { shippingMethod } = body.hydra
        let check_type_will_call = shippingMethod.href.search('type=WillCall')
        console.log('check_type_will_call', check_type_will_call)
        if (check_type_will_call !== -1) { //type willcall
            shipToAddress = {
                "full_address": `${pickUpAddressTWN.EN.city}${pickUpAddressTWN.EN.address1}`,
                "address1": pickUpAddressTWN.EN.address1,
                "address2": "",
                "state": "",
                "city": `${pickUpAddressTWN.EN.city}`,
                "zip": "",
                "country": pickUpAddressTWN.EN.country
            }
        } else {
            shipToAddress = {
                "full_address": `${zip}${city}${zone}${address}`,
                "address1": address,
                "address2": "",
                "state": "",
                "city": `${zip}${city}${zone}`,
                "zip": "",
                "country": country
            }
        }



        if (body.hydra.customer.mainAddress) {
            body.hydra.customer.mainAddress = shipToAddress
        }


        if (body.hydra.customer) {
            if (body.hydra.customer.humanName) {
                const native_name = body.hydra.customer.humanName['firstName@zh']
                shipToName = {
                    "firstName": native_name,
                    "lastName": "",
                }
            }
        } else {
            const { firstName, lastName } = body.hydra.shipToName
            shipToName = {
                "firstName": firstName,
                "lastName": lastName,
            }
        }

        let data = {
            ...body,
            hydra: {
                ...body.hydra,
                shipToName: shipToName,
                shipToAddress: shipToAddress
            },
            orderTermsJson: {
                ...body.orderTermsJson,
                order: {
                    ...body.orderTermsJson.order,
                    shipToName: shipToName,
                    shipToAddress: shipToAddress
                }
            }
        }

        // delete data.hydra

        const input = body
        const output = data
        const response = {
            input: body,
            output: data
        }
        const source_url = '/TWN/mapping_data'
        let logId = await saveLog(JSON.stringify(input), JSON.stringify(response), source_url)
        console.log('Log id', logId.data.id)
        return createResponse(200, { data: data })
    } catch (err) {
        let result = {
            success: false,
            message: err.message
        }
        return createResponse(400, { data: result })
    }
}

module.exports.TWNmappingAddress = async (e) => {
    try {
        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, TWNAddress)
        if (errorValidateBody) return createResponse(400, { message: errorValidateBody.message })

        const { address, city, zone, zip } = body

        const data = {
            full_address: zip + city + zone + address
        }

        return createResponse(200, { data: data })
    } catch (err) {
        let result = {
            success: false,
            message: err.message
        }
        return createResponse(400, { data: result })
    }
}


// else {
//     // find city
//     const splitCity = findCity(city_taiwan, city)
//     // console.log('splitCity', splitCity)
//     shipToAddress = {
//         "address1": address1,
//         "address2": "",
//         "state": "",
//         "zone": splitCity.zone,
//         "city": splitCity.city,
//         "zip": splitCity.zip,
//         "country": country
//     }
// }