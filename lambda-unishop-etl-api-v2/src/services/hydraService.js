const axios = require('axios')
const { utilsHelper } = require('lib-utils')
const { convertToQueryString, formatErrorService } = utilsHelper

const { API_URL_HYDRA } = process.env

const toError = (name, err) => formatErrorService(`hydraService-${name}`, err)

const getCommission = async ({ 
    tokenHydra, 
    customerHref
}) => {
    try{
        const url = `${API_URL_HYDRA}/customers/${customerHref}/commissionstatements`
    
        console.time(url)
        const { data } = await axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        })
        console.timeEnd(url)

        return data
    }catch(err){
        console.error(err)
        throw toError('getCommission', err)
    }
}

const getCustomerProfile = async ({ tokenHydra, customerHref }) => {
    try{
        const queryStrings = convertToQueryString({ expand: `metricsProfileHistory,profilePicture` })
        const url = `${API_URL_HYDRA}/customers/${customerHref}${queryStrings}`

        console.time(url)
        const { data } = await axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        })
        console.timeEnd(url)

        return data
    }catch(err){
        console.error(err)
        throw toError('getCustomerProfile', err)
    }
}

const getOrdersAndRmas = async ({ 
    tokenHydra, 
    customerHref, 
    dateCreated,
}) => {
    try{
        const queryStrings = convertToQueryString({ 
            expand: "order,rma",
            customer: "me|sponsoredCustomers?type=Customer",
            ...(dateCreated ? { dateCreated } : {}),
        })
        const url = `${API_URL_HYDRA}/customers/${customerHref}/ordersAndRmas${queryStrings}`
    
        console.time(url)
        const { data } = await axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        })
        console.timeEnd(url)
    
        return data
    }catch(err){
        console.error(err)
        throw toError('getOrdersAndRmas', err)
    }  
}

const getOrders = async ({ 
    tokenHydra, 
    customerHref, 
    dateCreated,
}) => {
    try{
        const queryStrings = convertToQueryString({ 
            expand: "order,rma",
            customer: "me|sponsoredCustomers?type=Customer",
            ...(dateCreated ? { dateCreated } : {}),
        })
        const url = `${API_URL_HYDRA}/customers/${customerHref}/orders${queryStrings}`
    
        console.time(url)
        const { data } = await axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        })
        console.timeEnd(url)
    
        return data
    }catch(err){
        console.error(err)
        throw toError('getOrders', err)
    }
}

const getSponsoredCustomersTreePreOrder = async ({ 
    tokenHydra, 
    customerHref, 
    maxTreeDepth,
    limit,
}) => {
    try{
        const queryStrings = convertToQueryString({ 
            maxTreeDepth,
            limit,
            expand: "self,profilePicture",
        })
        const url = `${API_URL_HYDRA}/customers/${customerHref}/sponsoredCustomersTreePreOrder${queryStrings}`

        console.time(url)
        const { data } = await axios({
            method: `get`,
            url,
            headers: {
                authorization: tokenHydra
            }
        })
        console.timeEnd(url)

        return data
    }catch(err){
        console.error(err)
        throw toError('getSponsoredCustomersTreePreOrder', err)
    }
}

const getAchievementsHistoryBetweenPeriods = async ({
    tokenHydra,
    customerHref,
    periodStart,
    periodEnd,
}) => {
    try{
        const beginDate = new Date(periodStart.getFullYear(), periodStart.getMonth())
        const endDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth())
        const currentDate = beginDate

        const apiUrl = `${API_URL_HYDRA}/customers/${customerHref}/achievementsHistory`
        const displayTimeCouter = `${apiUrl}, ${JSON.stringify({beginDate, endDate})}`
        
        console.time(displayTimeCouter)  
        const reqProcess = []
        do {
            const period = currentDate.toISOString().substring(0, 7)
            const queryStrings = convertToQueryString({ 
                expand: "metrics",
                period,
            })

            const url = `${apiUrl}${queryStrings}`
            reqProcess.push(axios({
                method: `get`,
                url,
                headers: {
                    authorization: tokenHydra
                }
            }))
            currentDate.setMonth(currentDate.getMonth() + 1)
        } while (currentDate <= endDate)
        const resResults = await Promise.allSettled(reqProcess)

        // Merge items
        const items = resResults
            .filter(r => r.status === "fulfilled")
            .reduce((list, r) => {
                const { value } = r || {}
                const { data } = value || {}
                const { items = [] } = data || {}

                return [...list, ...items]
            }, [])

        console.timeEnd(displayTimeCouter)  
        return { items }
    }catch(err){
        console.error(err)
        throw toError('getAchievementsHistoryBetweenPeriods', err)
    }
}

const loginTokens = async ({ body }) => {
    try{
        const queryStrings = convertToQueryString({ expand: "whoami" })
        const url = `${API_URL_HYDRA}/loginTokens${queryStrings}`

        console.time("loginTokens")
        const { data } = await axios({
            method: `post`,
            url,
            data: body,
        })
        console.timeEnd("loginTokens")

        return data
    }catch(err){
        console.error(err)
        throw toError('loginTokens', err)
    }
}

module.exports = {
    getCommission,
    getCustomerProfile,
    getOrdersAndRmas,
    getOrders,
    getSponsoredCustomersTreePreOrder,
    getAchievementsHistoryBetweenPeriods,
    loginTokens,
}