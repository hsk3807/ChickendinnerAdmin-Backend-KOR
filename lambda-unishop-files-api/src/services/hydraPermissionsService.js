const axios = require("axios")
const { httpStatus, createServiceError } = require('../utils/helpers')

module.exports.checkToken = async token => {
    const options = {
        method: 'GET',
        url: `https://hydra.unicity.net/v5a/whoami?expand=whoami`,
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const res = await axios(options)
    const { status, data = {} } = res

    if (status === 200) {
        return { data }
    } else {
        return createServiceError(httpStatus.Unauthorized, `Invalid Token.`)
    }
}