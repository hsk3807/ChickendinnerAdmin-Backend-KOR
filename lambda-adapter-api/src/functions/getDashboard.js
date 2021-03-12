const { createResponse, httpStatus, parseBodyJSON, generateCacheId } = require("../utils/helpers")
const { validateInput } = require("../utils/validator")
const DashboardSchema = require("../schema/dashboardSchema")
const DashboardService = require("../services/dashboardService")
const RequestCacheService = require("../services/requestCacheService")
const UserService = require("../services/userService")
const MockUpGenerator = require("../mockUps/MockUpGenerator")
const Helpers = require("../utils/helpers")

const { CACHE_REQUEST_MIN } = process.env

const REQUEST_KEYS = {
  BOX_PROFILE: "boxProfile",
  ORDER_HISTORY: "orderHistory",
  ADDRESS_BOOK: "addressBook",
  COMMISSION: "commission",
  FACEBOOK_LOGIN: "facebookLogin",
  SUCCESS_TRACKER: "successTracker",
  SEMINAR: "seminar",
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
      expand,
      baId,
      expandBoxProfile,
      expandOrderHistory,
      dateCreated: dateCreatedOrigin,
      customer,
      expandSuccessTracker,
      country_code,
      byPassCache,
    } = e.queryStringParameters;

    let { customerHref } = e.queryStringParameters;

    console.info('tokenHydra ====> ', tokenHydra)
    console.info('customerHref ====> ', customerHref)

    const dateCreated = dateCreatedOrigin
      ? dateCreatedOrigin.replace("|", ";")
      : undefined;

    // Vaidate all data
    let listOfExpandValidated;
    try {
      const { expand: expandValidated } = await checkBySchema(
        { expand },
        DashboardSchema.REQUIRE_QUERYSTRING
      );

      const listOfExpand = expandValidated.split(",");
      listOfExpandValidated = await checkBySchema(
        listOfExpand,
        DashboardSchema.LIST_OF_EXPAND
      );

      const isRequireCustomerHref =
        [
          "orderHistory",
          "addressBook",
          "facebookLogin",
          "successTracker",
        ].filter((value) => listOfExpandValidated.includes(value)).length > 0;

      if (isRequireCustomerHref && !customerHref && baId)
        customerHref = Helpers.createHashHref(baId, 'customer')

      if (listOfExpandValidated.includes(REQUEST_KEYS.BOX_PROFILE))
        await checkBySchema(
          { tokenHydra, customerHref, expandBoxProfile },
          DashboardSchema.BOX_PROFILE
        );

      if (listOfExpandValidated.includes(REQUEST_KEYS.ORDER_HISTORY))
        await checkBySchema(
          {
            tokenHydra,
            customerHref,
            expandOrderHistory,
            dateCreated,
            customer,
          },
          DashboardSchema.ORDER_HISTORY
        );

      if (listOfExpandValidated.includes(REQUEST_KEYS.ADDRESS_BOOK))
        await checkBySchema(
          { tokenHydra, customerHref },
          DashboardSchema.HYDRA_HEADER
        );

      if (listOfExpandValidated.includes(REQUEST_KEYS.COMMISSION))
        await checkBySchema({ tokenHydra }, DashboardSchema.HYDRA_TOKEN);

      if (listOfExpandValidated.includes(REQUEST_KEYS.FACEBOOK_LOGIN))
        await checkBySchema(
          { tokenHydra, customerHref },
          DashboardSchema.HYDRA_HEADER
        );

      if (listOfExpandValidated.includes(REQUEST_KEYS.SUCCESS_TRACKER))
        await checkBySchema(
          { tokenHydra, customerHref, expandSuccessTracker },
          DashboardSchema.SUCCESS_TRACKER
        );

      if (listOfExpandValidated.includes(REQUEST_KEYS.SEMINAR))
        await checkBySchema(
          { baId, tokenUshop, country_code },
          DashboardSchema.SEMINAR
        );

      if (listOfExpandValidated.includes(REQUEST_KEYS.LSB))
        await checkBySchema({ baId }, DashboardSchema.LSB);
    } catch (err) {
      console.error(err)
      return createResponse(httpStatus.badRequest, { message: err });
    }

    const allProcesses = {
      boxProfile: {
        func: DashboardService.getBoxProfile,
        parameter: {
          customerHref,
          tokenHydra,
          params: { expand: expandBoxProfile },
          byPassCache,
        },
      },
      orderHistory: {
        func: DashboardService.getOrderHistory,
        parameter: {
          customerHref,
          tokenHydra,
          params: {
            expand: expandOrderHistory,
            dateCreated: dateCreated
              ? dateCreated.replace("|", ";")
              : undefined,
            customer,
          },
          byPassCache,
        },
      },
      addressBook: {
        func: DashboardService.getAddressBook,
        parameter: {
          customerHref,
          tokenHydra,
          byPassCache,
        },
      },
      commission: {
        func: DashboardService.getCommission,
        parameter: {
          tokenHydra,
          customerHref,
          baId,
          byPassCache,
        },
      },
      facebookLogin: {
        func: DashboardService.getFacebookLogin,
        parameter: {
          customerHref,
          tokenHydra,
          byPassCache,
        },
      },
      successTracker: {
        func: DashboardService.getSuccessTracker,
        parameter: {
          customerHref,
          tokenHydra,
          params: { expand: expandSuccessTracker },
          byPassCache,
        },
      },
      seminar: {
        func: DashboardService.getSeminar,
        parameter: {
          baId,
          tokenUshop,
          params: { country_code },
        },
      },
      lsb: {
        func: DashboardService.getLsb,
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
