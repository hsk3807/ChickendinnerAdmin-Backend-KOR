const deepEqual = require('fast-deep-equal')
const { convertToUshopPermissions } = require('../utils/helpers')
const UserService = require("../services/UserService")

const genDefaultSettings = permissions => {
    const countryCodeList = Object.keys(permissions)
    const [defaultCountry] = countryCodeList
    const countries = countryCodeList.reduce((obj, countryCode) => {
        obj[countryCode] = {
            defaultLanguage: null,
            defaultMenu: null,
            defaultWarehouse: null,
        }
        return obj
    }, {})

    return { defaultCountry, countries }
}

const updateProfileSettings = async (username, userProfile, permissionsAD) => {
    const {
        permissionsAD: permissionsAdOrigin,
        settings: settingsOrigin,
    } = userProfile || {}
    const isPermissionsChanged = !deepEqual(permissionsAdOrigin, permissionsAD)

    if (isPermissionsChanged) {
        const updatePermissions = convertToUshopPermissions(permissionsAD)
        const newSettings = genDefaultSettings(updatePermissions)

        const { defaultCountry: defaultCountryOrigin } = settingsOrigin

        if (Object.keys(newSettings.countries).includes(defaultCountryOrigin))
            newSettings.defaultCountry = defaultCountryOrigin

        for (const countryCode of Object.keys(settingsOrigin.countries)) {
            if (newSettings.countries[countryCode]) {
                newSettings.countries[countryCode] = { ...settingsOrigin.countries[countryCode] }
            }
        }

        const updatedBy = username
        const updatedOn = new Date().toISOString()
        const updateUserProfile = {
            updatedBy,
            updatedOn,
            settings: newSettings,
            permissionsAD,
        }

        await UserService.updateUserProfile(username, updateUserProfile)
        return { username, ...updateUserProfile }
    }

    return userProfile
}

module.exports = {
    genDefaultSettings,
    updateProfileSettings
}