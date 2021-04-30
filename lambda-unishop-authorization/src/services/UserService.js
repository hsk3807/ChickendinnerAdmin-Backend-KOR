const axios = require("axios")
const qs = require('qs')
const { httpStatus, createServiceError } = require('../utils/helpers')
const db = require('../utils/dbConnector');

const tableName = process.env.DYNAMODB_TABLE_MAIN
const PARTITIONS = { USER_PROFILES: "userProfiles" }

module.exports.login = async ({ username, password }) => {
    const postData = {
        username,
        password: Buffer.from(password).toString('base64')
    };

    const options = {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: qs.stringify({ data: JSON.stringify(postData) }),
        url: `https://member-calls.unicity.com/api/unishop/backend/user/login`,
    };

    const res = await axios(options)
    const { status, data = {} } = res

    if (status === 200 && data.success) {
        return data
    } else {
        return createServiceError(httpStatus.badRequest, `Login failed.`)
    }
}

module.exports.employeeLogin = async ({ username, password }) => {
    const postData = {
        type: "base64",
        value: Buffer.from(`${username}:${password}`).toString('base64'),
        namespace: "https://hydra.unicity.net/v5a/employees"
    };

    const options = {
        method: 'POST',
        data: postData,
        url: `https://hydra.unicity.net/v5a/loginTokens?expand=whoami`,
    };

    const res = await axios(options)
    const { status, data = {} } = res

    if (status === 201) {
        return { data }
    } else {
        return createServiceError(httpStatus.Unauthorized, `Login failed.`)
    }
}

module.exports.employeeCheckToken = async hydraToken => {
    const options = {
        method: 'GET',
        url: `https://hydra.unicity.net/v5a/whoami?expand=whoami`,
        headers : {
            Authorization: `Bearer ${hydraToken}`
        }
    };

    const res = await axios(options)
    const { status, data = {} } = res

    if (status === 200) {
        return { data }
    } else {
        return createServiceError(httpStatus.Unauthorized, `Invalid HydraToken`)
    }
}

module.exports.getUserProfile = async username => {
    const { Item: userProfile } = await db.get(tableName, PARTITIONS.USER_PROFILES, username)

    if (userProfile) {
        delete userProfile.key
        delete userProfile.partition
    }

    return userProfile
}

module.exports.updateUserProfile = async (username, updateData) => {
    return db.replace(
        tableName,
        PARTITIONS.USER_PROFILES,
        username,
        updateData
    )
}

module.exports.createDefaultProfile = async (username, newUserProfile) => {
    await db.insert(
        tableName,
        PARTITIONS.USER_PROFILES,
        username,
        newUserProfile
    )``
    return newUserProfile

}