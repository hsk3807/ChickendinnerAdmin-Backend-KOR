const S3Service = require("../utils/s3Service")


const getRandomOne = async (type) => {
    try {
        if (type) {

        }
        const list = await S3Service.getFileListAll({
            Bucket: 'ushop-media.unicity.com',
            Prefix: `images/quotes/${type}`
        })
        let allData = list.length
        let randomData = Math.floor(Math.random() * allData)
        return list[randomData]
    } catch (e) {
        return e
    }

}

module.exports = {
    getRandomOne
}