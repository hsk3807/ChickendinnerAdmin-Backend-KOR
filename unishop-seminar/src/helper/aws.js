const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const BUCKET = process.env.BUCKET

module.exports.fileExists = async (fileName) => {
    const params = { Bucket: BUCKET, Key: fileName }
    try {
        await checkFile(fileName)
        return true
    } catch (error) {
        return false
    }

    function checkFile(fileName) {
        return new Promise(promiseHandler)

        function promiseHandler(resolve, reject) {
            s3.headObject(params, function(err, metadata) {
                if (err && err.code === 'NotFound') reject(false)
                resolve(true)
            })            
        }
    }
}
module.exports.readExcel = async (fileName) => {

    try {
        return await process(fileName)
    } catch (error) {
        console.log('readExcel', error.stack)
        return null
    }    

    function process(fileName) {
        return new Promise(promiseHandler)

        function promiseHandler(resolve, reject) {

            const params = { Bucket: BUCKET, Key: fileName }
            const file = s3.getObject(params).createReadStream()
            const buffers = []

            file.on('data', function(data) {
                buffers.push(data)
            })
            file.on('end', function() {
                const buffer = Buffer.concat(buffers)
                resolve(buffer)
            })
            file.on('error', function(error) {
                reject(error)
            })
        }
    }
}