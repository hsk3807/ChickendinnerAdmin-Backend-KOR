const isEqual = require('lodash.isequal');
const jwt = require('jsonwebtoken')
const secret = require('./secret')
const UserRoles = require('../helpers/userRoles')

const EXPIRES_IN = '30d'
// const EXPIRES_IN = '1d'

const httpStatus = {
    ok: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    Unauthorized: 401,
    notFound: 404,
    Conflict: 409,
    InternalServerError: 500
}

const parseBodyJSON = body => (typeof body === "object") ? body : JSON.parse(body || "{}")

const createResponse = (statusCode, { data, message, error }) => {
    const body = (message || error) ? { message, error } : data
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(body)
    }
}

const createServiceError = (httpStatus, message) => ({
    error: {
        httpStatus,
        message
    }
})

const toEmptyData = (sampleObj, setOnKeys = []) => {
    for (key of Object.keys(sampleObj)) {
        if (typeof sampleObj[key] === 'object' && sampleObj[key] !== null) {
            toEmptyData(sampleObj[key], setOnKeys)
        } else {
            if (setOnKeys.includes(key)) sampleObj[key] = null
        }
    }
}

const compressPermissions = permissions => Object
    .keys(permissions)
    .reduce((temp, country) => {
        let { countries, groups } = temp
        const currentPermission = permissions[country]
        const foundIndex = groups.findIndex(r => isEqual(r, currentPermission))
        const isNotFound = foundIndex === -1

        if (isNotFound) {
            groups.push(currentPermission)
            countries[country] = groups.length - 1
        } else {
            countries[country] = foundIndex
        }

        return { countries, groups }
    }, { countries: {}, groups: [] })

const extractPermissions = compressPermissions => {
    const { countries, groups } = compressPermissions
    return Object.keys(countries)
        .reduce((temp, country) => ({ ...temp, [country]: groups[countries[country]] }), {})
}

const generateToken = (payload, options) => {
    return jwt.sign(
        payload,
        secret,
        options ? options : { expiresIn: EXPIRES_IN },
    )
}

const getDecodeToken = token => jwt.decode(token)

const convertToUshopPermissions = permissionsAD => {
    // If has USHOP can access all modules & countries
    const isAccessAll = permissionsAD.indexOf("USHOP::ALL") > -1
    if (isAccessAll) return UserRoles.getAll()

    // Access by received permissionsAD 
    return permissionsAD
        .filter(p => new RegExp('^USHOP::').test(p))
        .sort()
        .reduce((obj, r) => {
            const [_, country, moduleKey] = r.split("::")

            // prepare blank object
            if (!obj.hasOwnProperty(country))
                obj = { ...obj, [country]: {} }

            // prepare blank object
            if (!obj[country].hasOwnProperty(moduleKey))
                obj[country] = { ...obj[country], [moduleKey]: {} }


            if (moduleKey === "ALL") {
                // if has ALL permissionsAD can access all modules of country
                obj[country] = UserRoles.getByCountryAll()
            } else {
                // assign permissionsAD from group name
                obj[country][moduleKey] = { ...obj[country][moduleKey], write: true }
            }

            return obj
        }, {})
}


const getToken = (username, permissions, isFullAccess = false) => generateToken({
    username,
    permissions: compressPermissions(permissions),
    isFullAccess,
})

const checkFullAccess = permissionsAD => permissionsAD.includes(`USHOP::ALL`)

module.exports = {
    httpStatus,
    parseBodyJSON,
    createResponse,
    createServiceError,
    compressPermissions,
    extractPermissions,
    generateToken,
    getDecodeToken,
    convertToUshopPermissions,
    getToken,
    checkFullAccess,
}