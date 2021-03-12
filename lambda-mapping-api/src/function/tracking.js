const axios = require('axios');
const { first } = require('lodash');
const get = require('lodash.get');

const traincingOrder = async (id) => {
    let url = `https://member-calls.unicity.com/api/unishop/v1/TH/payment/virgin_transport/tracking/${id}`
    try {
        let res = await axios({
            method: 'get',
            url: url,
            headers: { 'Content-Type': 'application/json' },
        })

        let data = first(res.data.data)
        console.log(data)

        let fillterData = data.responseObject.internal_trans
        let newData = fillterData.filter(element => element.name.roman !== null)
        console.log('newData', newData)
        newData = newData.map((element) => {
            const hour = element.track_time.slice(0, 2)
            let track_time
            if (hour > '12') {
                track_time = (hour - 12) + element.track_time.slice(2, 5) + ' PM'
            } else {
                track_time = element.track_time.slice(0, 5) + ' AM'
            }
            return {
                ...element,
                track_time: `${track_time}`
            }
        })
        data.responseObject.internal_trans = newData
        data.responseObject.order_id = id

        delete data.responseTime
        delete data.responseObject.driver_name
        delete data.responseObject.do_trans
        delete data.status
        delete data.responseMessage

        return data
    } catch (err) {
        return err
    }
}

module.exports = {
    traincingOrder,
}