const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const { S3_BUCKET_MEDIA } = process.env;

const getFileListAll = async (params) => {
  let isTruncated = true;
  let listOfUrls = [];

  while (isTruncated) {
    const {
      NextContinuationToken,
      IsTruncated,
      Contents,
    } = await s3.listObjectsV2(params).promise();

    isTruncated = IsTruncated;
    listOfUrls = [...listOfUrls, ...Contents.filter(({ Size }) => Size > 0)];
    params.ContinuationToken = NextContinuationToken;
  }

  return listOfUrls;
};

module.exports = {
  getFileListAll,
};
