const { createResponse, httpStatus } = require('../utils/helpers')
const PublicFileService = require("../services/publicFileService")

const genTree = (source ,parent = null) => {
    const list = source
        .filter(r => r.parent === parent)
        .map(r => {
            const {
                name,
                url,
                isFile,
            } = r

            const children = !isFile ? genTree(source, name) : null

            return {
                name,
                ...(isFile ? {url} : {}),
                ...(children ? {children} : {})
            }
        })

    return list
}

module.exports.handler = async e => {
    const { dir } = e.queryStringParameters || {}
    if (!dir) return createResponse(httpStatus.badRequest, { message: 'Directory required.' })

    const isTreeView = Object.keys(e.queryStringParameters).includes("tree")

    const prefix = `${dir}/`

    const listOfObjects = await PublicFileService.getContainFiles({prefix});

    const rmPrefixRegx = new RegExp(`^${prefix}`)
    const listOfFiles = listOfObjects
        .filter(({Key}) => Key !== prefix)
        .map(({Key}) => {
            const fileName = Key.replace(/^.*[\\\/]/, '')
            const isFile = !!fileName
            const path = Key.replace(rmPrefixRegx, "").replace(/\/$/, "")
            const pathList = path.split("/")
            const name = pathList[pathList.length - 1]
            const parent = pathList.length > 1 
                ? pathList[pathList.length -2]  
                : null
            
            return {
                name : name.replace(/\+/g, " "),
                url : `https://d351kq7iyhnk3y.cloudfront.net/${Key}`,
                parent: parent ? parent.replace(/\+/g, " ") : null,
                isFile,
            }
        })

    const responseData = isTreeView ? genTree(listOfFiles) : listOfFiles

    const data = JSON.stringify(responseData)
    return createResponse(httpStatus.ok, { data })
}