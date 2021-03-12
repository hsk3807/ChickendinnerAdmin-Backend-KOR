const { sitesConfig } = require("lib-global-configs")

const toJsonArray = rawData => {
    try {
        return rawData ? JSON.parse(rawData) : []
    } catch {
        return []
    }
}

const toJsonObj = rawData => {
    try {
        return rawData ? JSON.parse(rawData) : null
    } catch {
        return null
    }
}

const toStringArray = rawData => {
 try{
    return JSON.stringify(rawData)
 }catch{
     return "[]"
 } 
}

const toGroupObjValue = (obj, prefix, key, rawData) => ({
    ...obj,
    [prefix]: {
        ...(obj[prefix] || {}),
        [key.replace(new RegExp(`^${prefix}_`), "")]: rawData[key]
    }
})

const toGroupObjArray = (obj, prefix, key, rawData) => ({
    ...obj,
    [prefix]: {
        ...(obj[prefix] || {}),
        [key.replace(new RegExp(`^${prefix}_`), "")]: toJsonArray(rawData[key])
    }
})

const toGroupObjBool = (obj, prefix, key, rawData) => ({
    ...obj,
    [prefix]: {
        ...(obj[prefix] || {}),
        [key.replace(new RegExp(`^${prefix}_`), "")]: !!rawData[key]
    }
})

const extractGroupBool = (obj, key, objData) => {
    const extractObj = Object.keys(objData[key]).
        reduce((subObj, subKey) => ({ ...subObj, [`${key}_${subKey}`]: objData[key][subKey] ? 1 : 0 }), {})
    return {
        ...obj,
        ...extractObj,
    }
}

const extractGroupValue = (obj, key, objData) => {
    const extractObj = Object.keys(objData[key]).
        reduce((subObj, subKey) => ({ ...subObj, [`${key}_${subKey}`]: objData[key][subKey] }), {})
    return {
        ...obj,
        ...extractObj,
    }
}

const extractGroupArray = (obj, key, objData) => {
    const extractObj = Object.keys(objData[key]).
        reduce((subObj, subKey) => ({ ...subObj, [`${key}_${subKey}`]: toStringArray(objData[key][subKey]) }), {})
    return {
        ...obj,
        ...extractObj,
    }
}

const getNativeLanguageCode = countryCode => {
    const { language } = sitesConfig[countryCode] || {}
    const { list = [] } = language || {}
    const [code] = list.filter(c => c !== `EN`)
    return code
}

module.exports = {
    toJsonArray,
    toJsonObj,
    toStringArray,
    toGroupObjValue,
    toGroupObjArray,
    toGroupObjBool,
    extractGroupBool,
    extractGroupValue,
    extractGroupArray,
    getNativeLanguageCode,
}