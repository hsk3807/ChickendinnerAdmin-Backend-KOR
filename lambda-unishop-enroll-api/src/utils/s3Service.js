
const AWS = require('aws-sdk');
const s3 = new AWS.S3()

const getFileListAll = async params => {
    let isTruncated = true
    let listOfUrls = []

    while (isTruncated) {
        const {
            NextContinuationToken,
            IsTruncated,
            Contents,
        } = await s3.listObjectsV2(params).promise()

        isTruncated = IsTruncated
        listOfUrls = [
            ...listOfUrls,
            ...Contents.filter(({ Size }) => Size > 0)
        ]
        params.ContinuationToken = NextContinuationToken
    }

    return listOfUrls
}

const moveFile = async ({
    fromBucket,
    toBucket,
    key,
    renameKey,
}) => {
    const params = {
        Bucket: toBucket,
        Key: renameKey ? renameKey : key,
        CopySource: `/${fromBucket}/${key}`
    }
    const copyResult = await s3.copyObject(params).promise()
    const deleteResult = await s3.deleteObject({  Bucket: fromBucket, Key: key }).promise()

    return { copyResult, deleteResult } 
}

module.exports = {
    getFileListAll,
    moveFile,
}