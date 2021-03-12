const aws = require('aws-sdk');
const lambda = new aws.Lambda();

const { FUNC_NAME_SETTINGS_GET_PUBLISH_MENU } = process.env;

const invokeGetPublishMenu = async ({
  countryCode,
  baId,
  token,
  status,
  rank,
  showtimeDate,
  userCountry,
}) => {
  const pathParameters = { id: countryCode };
  const queryStringParameters = {
    baId,
    token,
    status,
    rank,
    showtimeDate,
    userCountry,
  };
  const e = { pathParameters, queryStringParameters };

  const { Payload: invokePayload } = await lambda
    .invoke({
      FunctionName: FUNC_NAME_SETTINGS_GET_PUBLISH_MENU,
      Payload: JSON.stringify(e, null, 2),
    })
    .promise();

  return invokePayload;
  const invokeResponse = JSON.parse(invokePayload);
  const { statusCode, body: rawBody } = invokeResponse;
  const body = JSON.parse(rawBody);

  if (statusCode !== 200) throw body;

  return body;
};

module.exports = {
  invokeGetPublishMenu,
};
