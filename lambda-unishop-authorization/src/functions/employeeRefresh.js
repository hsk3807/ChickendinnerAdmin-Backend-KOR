const deepEqual = require('fast-deep-equal')
const jwt = require('jsonwebtoken')
const secret = require('../utils/secret')
const {
    createResponse,
    httpStatus,
    getToken,
    convertToUshopPermissions,
    checkFullAccess,
} = require('../utils/helpers')
const UserService = require("../services/UserService")
const UserProfileHelper = require('../helpers/userProfileHelper')
const FakerUsers = require("../mockups/fakeUsers")

const verifyToken = token => new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
        if (err) reject(err)
        resolve(decoded)
    })
})

const checkToken = async token => {
    try {
        const data = await verifyToken(token)
        return { data }
    } catch (error) {
        const data = jwt.decode(token)
        return { error, data }
    }
}

module.exports.handler = async e => {
    try {
        const {
            Authorization: ushopAuthorization,
            "authorization-hydra": hydraAuthorization,
        } = e.headers
        if (!ushopAuthorization) return createResponse(httpStatus.Unauthorized, { message: 'Unauthorized' })

        const {
            data: decodedData,
            error: errorCheckToken
        } = await checkToken(ushopAuthorization)

        if (errorCheckToken) {
            const { name: errorName } = errorCheckToken || {}
            if (errorName != 'TokenExpiredError') {
                return createResponse(httpStatus.Unauthorized, { message: errorCheckToken })
            }
        }

        const { username } = decodedData

        let permissionsAD

        const fakeUser = FakerUsers.getUser(username)

        if (fakeUser && username === fakeUser.username) {
            permissionsAD = fakeUser.permissionsAD
        } else {
            if (!hydraAuthorization) return createResponse(httpStatus.Unauthorized, { message: 'Missing Token' })

            const { error: errorCheckToken, data: checkTokenData } = await UserService.employeeCheckToken(hydraAuthorization)
            if (errorCheckToken) return createResponse(httpStatus.Unauthorized, { message: 'Expired' })

            const { permissions: permissionsAdOrigin } = checkTokenData
            
            permissionsAD = [].includes(username)
                ? ["USHOP::ALL"]
                : permissionsAdOrigin
                    .filter(p => new RegExp('^USHOP::').test(p))
                    .sort()
            // .filter(p=> username==="Patchamets" ? p !== "USHOP::ALL" : true)
        }

        const permissions = convertToUshopPermissions(permissionsAD)
        const isFullAccess = checkFullAccess(permissionsAD)
        const ushopToken = getToken(username, permissions, isFullAccess)
        let userProfile = await UserService.getUserProfile(username)
        userProfile = await UserProfileHelper.updateProfileSettings(username, userProfile, permissionsAD)
        const data = {
            username,
            ushopToken,
            userProfile,
            token: process.env.USHOP_TOKEN,
            hydraToken: hydraAuthorization,
            decodedData,
            errorCheckToken,
        }

        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
};