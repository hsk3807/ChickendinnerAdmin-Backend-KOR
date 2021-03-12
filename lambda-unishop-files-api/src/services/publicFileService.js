const AWS = require('aws-sdk');
const s3 = new AWS.S3()

const {
    S3_BUCKET_MAIN: bucketMain,
} = process.env

module.exports.getContainFiles = async ({prefix}) => {
    const maxKeys = 1000
    let keyCount = null
    let buffContents = []
    let startAfter = null

    while(keyCount === null || keyCount >= maxKeys){
        const params = {
            Bucket: bucketMain,
            Prefix: prefix,
            MaxKeys: maxKeys,
            EncodingType: "url",
            ...(startAfter ? {StartAfter: startAfter}: {})
        }
        const result = await s3.listObjectsV2(params).promise()
        const { 
            Contents = [],
            KeyCount
        } = result || {}

        const {Key: lasyKey} = Contents[Contents.length-1]
        startAfter = lasyKey

        buffContents = [...buffContents, ...Contents]
        keyCount = KeyCount
    }
    return buffContents
}