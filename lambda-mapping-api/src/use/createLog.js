const axios = require('axios');

module.exports.saveLog = async (message, response, url) => {
    let res = await axios({
        method: 'post',
        url: 'https://member-calls2-kr.unicity.com/unishop-fn-misc/log',
        headers: { 'Content-Type': 'application/json' },
        data: {
            "message": message,
            "response": response,
            "url": url
        }
    })
    return res.data
};

