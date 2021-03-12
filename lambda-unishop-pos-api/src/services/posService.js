const S3Service = require("../utils/s3Service")

const { S3_BUCKET_USHOP_ADMIN } = process.env

const getLinks = async countryCode => {
    const Bucket = S3_BUCKET_USHOP_ADMIN
    const Prefix = `pos/${countryCode}`
    const files = await S3Service.getFileListAll({ Bucket, Prefix })   
    const list = files
        .filter(r => /index.html$/.test(r.Key))
        .filter(r => r.Key.split("/").length === 4)
        .map(r => {
            const [_, countryCode, name] = r.Key.split("/")
            return {
                countryCode,
                name,
                link: `https://${S3_BUCKET_USHOP_ADMIN}/pos/${countryCode}/${name}/index.html`
            }
        })
    return list
}

module.exports = {
    getLinks
}