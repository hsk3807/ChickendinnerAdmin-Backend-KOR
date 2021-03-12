const AWS = require('aws-sdk');
const s3 = new AWS.S3()

const {
    S3_BUCKET_TEMP: bucketTemp,
    FILE_EXPIRE_MINUTES,
} = process.env

const fileExpireMinutes = !isNaN(FILE_EXPIRE_MINUTES) ? parseInt(FILE_EXPIRE_MINUTES) : 1

module.exports.writeFile = async (data, fileName) => {
    const Expires = new Date().getTime() + (fileExpireMinutes * 60000)

    const params = {
        Bucket: bucketTemp,
        Key: fileName,
        Body : data,
        ACL: `public-read`,
        Expires
    }   
    const result =  await s3.putObject(params).promise()

    const { LocationConstraint: region } = await s3.getBucketLocation({ Bucket: bucketTemp }).promise()
    const url = result
        ? `https://s3-${region}.amazonaws.com/${bucketTemp}/${fileName}`
        : null
    const expire = new Date(Expires)

    return { url, expire }

}