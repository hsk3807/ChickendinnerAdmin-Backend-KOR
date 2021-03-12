const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const getDictionaryList = require('./getDictionaryList')
const { Parser } = require('json2csv');
const tempBucketService = require('../services/tempBucketService')
const uuid = require('uuid')

module.exports.handler = async e => {
    try {
        const res = await getDictionaryList.handler(e)
        const {
            statusCode,
            body:bodyResponse,
        } = res

        const datasource = parseBodyJSON(bodyResponse)

        if (statusCode === 200){
            const [firstRow] = datasource
            const fields = firstRow ? Object.keys(firstRow) : []
            const opts = { fields };

            const parser = new Parser(opts);
            const csvData = parser.parse(datasource)
            const universalBOM = '\ufeff';
            const csvDataExport = universalBOM+csvData
            
            const fileName = `${uuid.v1()}/ushop_dict_${new Date().getTime()}.csv`
            const data = await tempBucketService.writeFile(csvDataExport, fileName)

            return createResponse(httpStatus.ok, { data })
        }else{
            return createResponse(statusCode, data)
        }
        
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err })
    }
}