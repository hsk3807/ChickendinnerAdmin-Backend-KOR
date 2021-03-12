const AWS = require('aws-sdk');
const s3 = new AWS.S3()
const uuid = require('uuid')
const db = require('../utils/dbConnector');
const { httpStatus, createServiceError } = require('../utils/helpers')

const {
    DYNAMODB_TABLE_MAIN: tableName,
    S3_BUCKET_MAIN: bucketMain,
    S3_BUCKET_TEMP: bucketTemp,
    FILE_EXPIRE_MINUTES,
    S3_PATH_DOWNLOAD_FILES,
} = process.env

const fileExpireMinutes = !isNaN(FILE_EXPIRE_MINUTES) ? parseInt(FILE_EXPIRE_MINUTES) : 1

const PARTITIONS = {
    DOWNLOAD_FILES: "download_files"
}


module.exports.copyFileToPrivate = async (countryCode, fileName) => {
    const params = {
        CopySource: `/${bucketTemp}/${fileName}`,
        Bucket: bucketMain,
        Key: `${countryCode}/${S3_PATH_DOWNLOAD_FILES}/${fileName}`,
    }
    return s3.copyObject(params).promise()
}

module.exports.copyFileToPublicLink = async (countryCode, targerFileName, overwriteFileName) => {
    const linkPath = `${countryCode}-${uuid.v1()}`
    const fileName= overwriteFileName ? overwriteFileName : targerFileName
    const Expires = new Date().getTime() + (fileExpireMinutes * 60000)
    const result = await s3.copyObject({
        CopySource: `/${bucketMain}/${countryCode}/${S3_PATH_DOWNLOAD_FILES}/${targerFileName}`,
        Bucket: bucketTemp,
        Key: `${linkPath}/${fileName}`,
        ACL: `public-read`,
        Expires
    }).promise()
    if (!result) return createServiceError(httpStatus.notFound, `${countryCode}/${fileName} not found.`)

    const { LocationConstraint: region } = await s3.getBucketLocation({ Bucket: bucketTemp }).promise()
    const url = result
        ? `https://s3-${region}.amazonaws.com/${bucketTemp}/${linkPath}/${fileName}`
        : null
    const expire = new Date(Expires)

    return { url, expire }
}

module.exports.removeFile = async (countryCode, fileName) => {
    const params = {
        Bucket: bucketMain,
        Key: `${countryCode}/${S3_PATH_DOWNLOAD_FILES}/${fileName}`,
    }
    return s3.deleteObject(params).promise()
}

module.exports.removeFileMultiple = async (countryCode, listOfFileName) => {
    const Objects = listOfFileName.map(fileName => ({ Key: `${countryCode}/${S3_PATH_DOWNLOAD_FILES}/${fileName}` }))
    const params = {
        Bucket: bucketMain,
        Delete: { Objects },
    }
    return s3.deleteObjects(params).promise()
}

module.exports.removeTempFile = async fileName => {
    const params = {
        Bucket: bucketTemp,
        Key: `${fileName}`,
    }
    return s3.deleteObject(params).promise()
}

module.exports.addData = async (countryCode, newDownloadFile) => {
    const { DOWNLOAD_FILES: partition } = PARTITIONS

    const { Item: downloadFiles } = await db.get(tableName, partition, countryCode)
    if (!downloadFiles) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const expression = 'set #list = list_append(if_not_exists(#list, :emptyList), :newDownloadFile)'
    const names = {
        '#list': 'list'
    }
    const values = {
        ':newDownloadFile': [newDownloadFile],
        ':emptyList': []
    }
    await db.update(
        tableName,
        partition,
        countryCode,
        {
            expression,
            names,
            values
        }
    )

    const data = newDownloadFile
    return { data }
}

module.exports.getListData = async countryCode => {
    const partition = PARTITIONS.DOWNLOAD_FILES

    const { Item: downloadFiles } = await db.get(tableName, partition, countryCode)
    if (!downloadFiles) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list = [] } = downloadFiles || {}
    const data = list

    return { data }
}

module.exports.getData = async (countryCode, id) => {
    const partition = PARTITIONS.DOWNLOAD_FILES

    const { Item: downloadFiles } = await db.get(tableName, partition, countryCode)
    if (!downloadFiles) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list = [] } = downloadFiles || {}
    const data = list.find(r => r.id === id)
    if (!data) return createServiceError(httpStatus.notFound, `${id} not found.`)

    return { data }
}

module.exports.updateList = async (countryCode, list) => {
    const partition = PARTITIONS.DOWNLOAD_FILES
    const expression = 'set #list = :list'
    const names = {
        '#list': 'list'
    }
    const values = {
        ':list': list
    }
    const data = await db.update(
        tableName,
        partition,
        countryCode,
        { expression, names, values })

    return { data }
}

module.exports.update = async (countryCode, id, editData) =>{
    const partition = PARTITIONS.DOWNLOAD_FILES

    const { Item: fileDocument } = await db.get(tableName, partition, countryCode)
    if (!fileDocument) return createServiceError(httpStatus.notFound, `${countryCode} not found.`)

    const { list } = fileDocument
    const foundIndex = list.findIndex(r => r.id === id)
    if (foundIndex === -1) return createServiceError(httpStatus.notFound, `${id} Data not found.`)

    const updateItem = Object.assign(list[foundIndex], editData)
    list.splice(foundIndex, 1, updateItem)

    const expression = 'set #list = :list'
    const names = {
        '#list': 'list'
    }
    const values = {
        ':list': list
    }
    const data = await db.update(
        tableName,
        partition,
        countryCode,
        { expression, names, values })

    return { data }
}