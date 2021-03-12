const jwt = require('jsonwebtoken')
const ACCESS = require('./accessConfig')

const extractPermissions = compressPermissions => {
    const { countries, groups } = compressPermissions
    return Object.keys(countries)
        .reduce((temp, country) => ({ ...temp, [country]: groups[countries[country]] }), {})
}

const getDecodeToken = token => jwt.decode(token)

const checkAllow = (e, countryCode, moduleKey, requireAccess) => {
    let isAllow = false
    let decodedData
    let errMessage = "Access required."

    try {
        const { headers } = e || {}
        const { Authorization: token } = headers || {}
        decodedData = jwt.decode(token)

        const { permissions: compressPermissions } = decodedData || {}
        const permissions = extractPermissions(compressPermissions)

        const countryPermission = permissions[countryCode] || {}
        const grantedPermission = countryPermission[moduleKey] || {}

        if (!Object.keys(permissions).includes(countryCode)) errMessage = "Invalid countryCode."

        switch (requireAccess) {
            case ACCESS.READ:
                isAllow = grantedPermission.read == true || grantedPermission.write == true
            case ACCESS.WRITE:
                isAllow = grantedPermission.write == true
        }

    } catch (err) {
        console.error(err)
    }

    return { isAllow, decodedData, errMessage }
}

module.exports = {
    extractPermissions,
    getDecodeToken,
    checkAllow,
}