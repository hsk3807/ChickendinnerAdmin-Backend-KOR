const deepEqual = require('fast-deep-equal')
const {
    parseBodyJSON,
    createResponse,
    httpStatus,
    convertToUshopPermissions,
    getToken,
    checkFullAccess,
} = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const UserSchema = require("../schema/userSchema")
const UserService = require("../services/UserService")
const UserProfileHelper = require('../helpers/userProfileHelper')
const FakerUsers = require("../mockups/fakeUsers")


const checkSignInFakerUser = (username, password) => {
    let data, error
    const fakeUser = FakerUsers.getUser(username)
   
    if (fakeUser) {
        if (username === fakeUser.username) {
            if (password === fakeUser.password) {
                const { permissions, permissionsAD } = fakeUser
                data = { permissions, permissionsAD }
            } else {
                error = {
                    httpStatus: httpStatus.Unauthorized,
                    message: 'Unauthorized'
                }
            }
        }
    }

    return { data, error }
}

const createNewUserProfile = async (username, permissions, permissionsAD) => {
    const settings = UserProfileHelper.genDefaultSettings(permissions)
    const updatedBy = username
    const updatedOn = new Date().toISOString()
    const newUserProfile = {
        updatedBy,
        updatedOn,
        settings,
        permissionsAD,
    }
    return await UserService.createDefaultProfile(username, newUserProfile)
}

const getUserProfile = async (username, permissions, permissionsAD) => {
    const userProfile = await UserService.getUserProfile(username)
    return userProfile
        ? userProfile
        : await createNewUserProfile(username, permissions, permissionsAD)
}

module.exports.handler = async e => {
    try {
        const body = parseBodyJSON(e.body)

        const { error: errorValidate, value: validatedBody } = validateInput(body, UserSchema.LOGIN)
        if (errorValidate) return createResponse(httpStatus.badRequest, { message: errorValidate.message })

        const { username, password } = validatedBody

        // SignIn with superuser
        const {
            data: superUserData,
            error: errCheckSuperUser
        } = checkSignInFakerUser(username, password)
        if (errCheckSuperUser)
            return createResponse(errCheckSuperUser.httpStatus, { message: errCheckSuperUser.message })

        if (superUserData) {
            const {
                permissions: superUserPermissions,
                permissionsAD: superUserPermissionsAD,
            } = superUserData || {}

            const isAccessAll = checkFullAccess(superUserPermissionsAD)
            const ushopToken = getToken(username, superUserPermissions, isAccessAll)
            let userProfile = await getUserProfile(username, superUserPermissions, superUserPermissionsAD)
            userProfile = await UserProfileHelper.updateProfileSettings(username, userProfile, superUserPermissionsAD)
            const data = {
                username,
                ushopToken,
                userProfile,
                token: process.env.USHOP_TOKEN,
            }
            return createResponse(httpStatus.ok, { data })
        }

        // SignIn with AD User
        const { error: errorLogin, data: userDataAD } = await UserService.employeeLogin(validatedBody)
        if (errorLogin) return createResponse(errorLogin.httpStatus, { message: errorLogin.message })

        const {
            whoami,
            token: hydraToken,
            error: errorData
        } = userDataAD
        if (errorData) return createResponse(httpStatus.Unauthorized, { message: 'Unauthorized whoami' })

        // const { error: errorCheckToken, data: checkTokenData } = await UserService.employeeCheckToken(hydraToken)
        // if (errorCheckToken) return createResponse(httpStatus.Unauthorized, { message: errorCheckToken.message })

        const { permissions: permissionsAdOrigin } = whoami
        const permissionsAD = [].includes(username)
            ? ["USHOP::ALL"]
            : permissionsAdOrigin
                .filter(p => new RegExp('^USHOP::').test(p))
                .sort()

        const permissions = convertToUshopPermissions(permissionsAD)
        const isFullAccess = checkFullAccess(permissionsAD)
        const ushopToken = getToken(username, permissions, isFullAccess)
        let userProfile = await getUserProfile(username, permissions, permissionsAD)
        userProfile = await UserProfileHelper.updateProfileSettings(username, userProfile, permissionsAD)
        const data = {
            username,
            ushopToken,
            userProfile,
            token: process.env.USHOP_TOKEN,
            hydraToken,
        }
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message, error: err })
    }
}