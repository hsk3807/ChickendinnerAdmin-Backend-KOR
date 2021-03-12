
const SitesConfig = require("../configs/SitesConfig")

const uShopWebsites = [
    "https://ushop2020.unicity.com",
    "https://ushop.unicity.com",
]


const getRoutePrefix = countryCode => {
    const { prefixRoute } = SitesConfig[countryCode]
    return prefixRoute
}

const removeUShopUrl = (countryCode, obj) => {
    const prefixRoute = getRoutePrefix(countryCode)
    const regxString = `^${uShopWebsites.map(website => `${website}/${prefixRoute}`).join(`|`)}` 
    const regxUshopWebsites = new RegExp(regxString)

    for (key of Object.keys(obj)) {
        if (obj[key]) {
            if (typeof obj[key] === "string" && regxUshopWebsites.test(obj[key])) {
                obj[key] = obj[key].toString().replace(regxUshopWebsites, "")
            } else if (Array.isArray(obj[key])) {
                removeUShopUrl(countryCode, obj[key])
            } else if (typeof obj[key] === "object") {
                removeUShopUrl(countryCode, obj[key])
            }
        }
    }
}

module.exports = {
    removeUShopUrl,
}