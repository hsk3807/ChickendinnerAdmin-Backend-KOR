const { createResponse, httpStatus, parseBodyJSON, generateCacheId } = require("../../utils/helpers")
const { validateInput } = require("../../utils/validator")
const DashboardSchema = require("../../schema/dashboardSchema")
const RequestCacheService = require("../../services/requestCacheService")
const UserService = require("../../services/userService")
const MockUpGenerator = require("../../mockUps/MockUpGenerator")
const Helpers = require("../../utils/helpers")
const etlDashboardService = require("../../services/etlDashboardService")
const MockupHelper = require("../../utils/mockupHelper")
const get = require("lodash.get")
const EtlAdapterMockupService = require("../../services/etlAdapterMockupService")

const { CACHE_REQUEST_MIN } = process.env

const REQUEST_KEYS = {
  COMMISSION: "commission",
  LSB: "lsb",
};

const checkBySchema = async (inputObj, compareSchema) => {
  const { error, value } = validateInput(inputObj, compareSchema);
  if (error) throw error;
  return value;
};


const getData = async e => {
  try {
    const {
      "authorization-hydra": tokenHydra,
      "authorization-ushop": tokenUshop,
    } = e.headers;

    const {
      baId,
      byPassCache,
    } = e.queryStringParameters;

    const source_url = get(e, 'headers.referer', 'No Referer')

    let { customerHref } = e.queryStringParameters;

    const isUseMockup = MockupHelper.checkUsageByBaId(baId)
    
    if (isUseMockup) {
      const mockupData = await EtlAdapterMockupService.getCommission()
      const blendData = MockupHelper.getBlendData(mockupData)
      if (mockupData) return createResponse(httpStatus.ok, { data: JSON.stringify(blendData) })
    }
    // Vaidate all data
    let listOfExpandValidated;
    try {
      // const { expand: expandValidated } = await checkBySchema(
      //   { expand },
      //   DashboardSchema.REQUIRE_QUERYSTRING
      // );

      // const listOfExpand = expandValidated.split(",");
      // listOfExpandValidated = await checkBySchema(
      //   listOfExpand,
      //   DashboardSchema.LIST_OF_EXPAND
      // );

      // if (listOfExpandValidated.includes(REQUEST_KEYS.COMMISSION))
      checkBySchema({ tokenHydra }, DashboardSchema.HYDRA_TOKEN);

      // if (listOfExpandValidated.includes(REQUEST_KEYS.LSB))
      await checkBySchema({ baId }, DashboardSchema.LSB);
      listOfExpandValidated = [
        REQUEST_KEYS.COMMISSION,
        REQUEST_KEYS.LSB
      ]
    } catch (err) {
      console.error(err)
      return createResponse(httpStatus.badRequest, { message: err });
    }

    const allProcesses = {
      commission: {
        func: etlDashboardService.getCommission,
        parameter: {
          tokenHydra,
          customerHref,
          baId,
          byPassCache,
          source_url
        },
      },

      lsb: {
        func: etlDashboardService.getLsb,
        parameter: { baId },
      },
    };

    const runProcesses = listOfExpandValidated.map((key) => {
      const { func, parameter } = allProcesses[key];
      return func(parameter);
    });

    const finishedProcesses = await Promise.all(runProcesses);

    const processResults = finishedProcesses.reduce(
      (obj, res, index) => ({
        ...obj,
        [listOfExpandValidated[index]]: res,
      }),
      {}
    );

    const data = JSON.stringify(processResults);
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
      error: err,
    });
  }
};

module.exports.handler = async e => {
  try {
    return await getData(e)
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
      error: err,
    });
  }
}
