const { sitesConfig } = require('lib-global-configs')
const premissions = require('../mockups/permissions')

module.exports.getAll = () => Object.keys(sitesConfig)
    .reduce((list, country) => ({
        ...list,
        [country]: premissions.all,
    }), {})

module.exports.getByCountryAll = () => premissions.all

module.exports.getRolesBannerOnly = countryCodes => countryCodes
    .reduce((list, country) => ({
        ...list,
        [country]: premissions.bennerOnly,
    }), {})

module.exports.getTest = () => ({
    THA: premissions.all,
    JPN: premissions.bannerAndFooter,
    PHL: premissions.bennerOnly,
})
