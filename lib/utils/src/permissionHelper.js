
const jwt = require('jsonwebtoken')
const { httpStatus } = require("lib-global-configs")
const utilsHelper = require("./utilsHelper")
const { formatErrorHelper } = require("./utilsHelper")

const toError = (name, err) => formatErrorHelper(`permissionHelper-${name}`, err)

const getDecodeToken = ushopToken => jwt.decode(ushopToken)

const extractPermissions = compressPermissions => {
    const { countries, groups } = compressPermissions
    return Object.keys(countries)
        .reduce((temp, country) => ({ ...temp, [country]: groups[countries[country]] }), {})
}

const checkAllow = ({
    e,
    countryCode,
    moduleKey,
}) => {
    try{
        const { Authorization: ushopToken } = e.headers || {}
        const decodedData = jwt.decode(ushopToken)
        const { 
            username,
            permissions: compressPermissions 
        } = decodedData || {}
        const permissions = extractPermissions(compressPermissions)
        const countryPermission = permissions[countryCode] || {}
        const grantedPermission = countryPermission[moduleKey] || null
        const isAllow = grantedPermission && grantedPermission.write

        return {
            username,
            isAllow,
            moduleKey,
        }
    }catch(err){
        console.error(err)
        throw toError('checkAllow', err)
    }
}

module.exports = {
    getDecodeToken,
    checkAllow,
    extractPermissions,
}