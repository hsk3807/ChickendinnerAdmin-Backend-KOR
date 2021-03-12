const axios = require('axios')
const { API_URLS } = require('./configs')

module.exports.getList = async ({ tokenHydra, customerHref }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/shiptooptions`
    const { data } = await axios({
        method: `get`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })

    const {shipToOptions = []} = data || {}

    return shipToOptions.map(({shipToAddress, shipToName, shipToOptionId, href}) => {
        const addressHref = href.split("/").pop()
        return {
            addressHref,
            shipToAddress,
            shipToName,
            shipToOptionId
        }
    })
}

module.exports.add = async ({ tokenHydra, customerHref, newValue }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/shiptooptions`
    
    let data, error
    try{
       const { data: responseData } =  await axios({
            method: `post`,
            url,
            headers: {
                authorization: tokenHydra
            },
            data: newValue
        })
        data = responseData
    }catch(err){
        error = err.response
    } 

    return {error, data}
}

module.exports.delete = async ({ tokenHydra, customerHref, addressHref }) => {
    const url = `${API_URLS.HYDRA}/customers/${customerHref}/shiptooptions/${addressHref}`
    return axios({
        method: `delete`,
        url,
        headers: {
            authorization: tokenHydra
        }
    })
}