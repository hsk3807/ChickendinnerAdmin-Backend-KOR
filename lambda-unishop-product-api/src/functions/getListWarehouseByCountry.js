const { createResponse, httpStatus } = require('../utils/helpers');
const { validateInput } = require('../utils/validator');
const WarehouseService = require('../services/warehouseService');
const GeneralSchema = require('../schema/generalSchema');

module.exports.handler = async (e) => {
  try {
    const pathParams = e.pathParameters || {};

    const { error: errorValidate, value: validatedPathParams } = validateInput(
      pathParams,
      GeneralSchema.COUNTRY_CODE
    );
    if (errorValidate)
      return createResponse(httpStatus.badRequest, { message: 'testset' });

    const { countryCode } = validatedPathParams;
    const data = await WarehouseService.getNameList(countryCode);

    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
      error: err,
    });
  }
};
