const { sitesConfig, mappingStatusList } = require('lib-global-configs');
const { tokenGenerator } = require('lib-utils');
const { createResponse, httpStatus } = require('../utils/helpers');
const { validateInput } = require('../utils/validator');
const GeneralSchema = require('../schema/generalSchema');
const MenuSchema = require('../schema/menuSchema');
const MenuService = require('../services/menuService');
const UserService = require('../services/userService');
const EtlGenealogyServices = require('../services/etlGenealogyServices');
const getEtlOnSelf = require('../functions/etl/getOnself');
const QuotesService = require('../services/quotesService');
const PopupService = require('../services/popupService');

const getRank = (onSelf) => {
  const { profile } = onSelf || {};
  const { metricsProfileHistory } = profile || {};
  const { aggregate } = metricsProfileHistory || {};
  const { cumulativeMetricsProfile } = aggregate || {};
  const { highestRankShort } = cumulativeMetricsProfile || {};
  return highestRankShort || null;
};

const getStatusItem = (onSelf) => {
  const { profile } = onSelf || {};
  const { type, status } = profile || {};
  const foundItem = mappingStatusList.find(
    (r) => r.type === type && r.status === status
  );
  return foundItem;
};

const getUserCountry = (onSelf) => {
  const { profile } = onSelf || {};
  const { mainAddress } = profile || {};
  const { country } = mainAddress || {};
  const userCountry = Object.keys(sitesConfig).find((key) => {
    const { countryCode } = sitesConfig[key];
    return country === countryCode.alpha2;
  });
  return userCountry || null;
};

const getMemberExpireDate = (onSelf) => {
  const { profile } = onSelf || {};
  const { subscriptions } = profile || {};
  const [firstItem] = subscriptions || [];
  const { endDate } = firstItem || {};
  return endDate || null;
};

module.exports.handler = async (e) => {
  try {
    const { 'authorization-hydra': hydraToken } = e.headers;
    const { countryCode, baId, token } = e.queryStringParameters || {};

    const {
      error: errorValidateCountryCode,
      value: countryCodeValid,
    } = validateInput(countryCode, GeneralSchema.VALID_COUNTRY);
    if (errorValidateCountryCode)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateCountryCode.message,
      });

    // quotes
    console.time('[quotes]');
    const quotes = await QuotesService.getRandomSet({
      countryCode: countryCodeValid,
    });
    console.timeEnd('[quotes]');

    if (hydraToken) {
      // if login
      // Check Params
      const { error: errorParams } = validateInput(
        { baId, token },
        MenuSchema.GET_PARAMS
      );
      if (errorParams)
        return createResponse(httpStatus.badRequest, {
          message: errorParams.message,
        });

      // Check Token
      const isValidToken = tokenGenerator.validate(baId, token);
      if (!isValidToken)
        return createResponse(httpStatus.forbidden, {
          message: 'token invalid.',
        });

      console.time('[checkToken, onselfResponse]');
      const [checkToken, onselfResponse] = await Promise.all([
        UserService.refreshCustomerToken(hydraToken),
        getEtlOnSelf.handler({
          headers: { 'authorization-hydra': hydraToken },
          queryStringParameters: {
            baId,
            token,
            ushopCountryCode: countryCodeValid,
          },
        }),
      ]);
      console.timeEnd('[checkToken, onselfResponse]');

      const onSelf = JSON.parse(onselfResponse.body);
      if (onselfResponse.statusCode !== 200)
        return createResponse(httpStatus.InternalSersverError, {
          message: 'Get Onself Error.',
          error: onSelf,
        });

      const rank = getRank(onSelf);
      const statusItem = getStatusItem(onSelf);
      const { code: status = null } = statusItem || {};
      const showtimeDate = getMemberExpireDate(onSelf);
      const userCountry = getUserCountry(onSelf);

      console.time('[popup]');
      let popup = await PopupService.invokeGetPublishMenu({
        countryCode: countryCodeValid,
        baId,
        token,
        status,
        userCountry,
      });
      console.timeEnd('[popup]');

      console.time('[menu]');
      const menu = await MenuService.invokeGetPublishMenu({
        countryCode: countryCodeValid,
        baId,
        token,
        rank,
        status,
        showtimeDate,
        userCountry,
      });
      console.timeEnd('[menu]');

      if (menu && Array.isArray(menu.mobile)) {
        // genealogy is exists prepare for cache
        const foundGenealogyMenu = menu.mobile.find(
          (r) => r.menuKey === 'genealogy'
        );
        if (foundGenealogyMenu) {
          console.time('[genealogy]');
          await EtlGenealogyServices.invokePrepareCache({
            headers: { 'authorization-hydra': hydraToken },
            queryStringParameters: { baId, token, byPassCache: true },
          });
          console.timeEnd('[genealogy]');
        }
      }

      const data = JSON.stringify({
        quotes,
        menu,
        checkToken,
        onSelf,
        popup,
      });
      return createResponse(httpStatus.ok, { data });
    } else {
      // if not login
      const menu = await MenuService.invokeGetPublishMenu({
        countryCode: countryCodeValid,
      });

      return createResponse(httpStatus.badRequest, {
        message: menu,
      });

      let popup = await PopupService.invokeGetPublishMenu({
        countryCode: countryCodeValid,
      });

      return createResponse(httpStatus.badRequest, {
        message: popup,
      });
      const data = JSON.stringify({
        quotes,
        menu,
        popup,
      });
      return createResponse(httpStatus.ok, { data });
    }
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
      error: err,
    });
  }
};
