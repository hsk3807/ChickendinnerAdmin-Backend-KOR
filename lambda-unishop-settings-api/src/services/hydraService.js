const axios = require("axios")
const { httpStatus } = require('../utils/helpers')

const checkToken = async hydraToken => {
    let data, error
    try {
        const url = `https://hydra.unicity.net/v5a/whoami?expand=whoami`
        console.time(url)
        const options = {
            method: `get`,
            url,
            headers: {
                authorization: new RegExp('^Bearer').test(hydraToken) ? hydraToken : `Bearer ${hydraToken}`
            }
        }
        const result = await axios(options)
        data = result.data
        console.timeEnd(url)
    } catch (err) {
        console.error(err)
        error = err
    }

    return { data, error }
}


module.exports = {
    checkToken
}