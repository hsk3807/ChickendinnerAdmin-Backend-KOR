const {
  createResponse,
  httpStatus,
  parseBodyJSON,
} = require('../utils/helpers');
const { validateInput } = require('../utils/validator');
const GeneralSchema = require('../schema/generalSchema');
const MenuSchema = require('../schema/menuSchema');
const PermissionHelpers = require('../utils/permissionHelpers');
const MenuService = require('../services/menuService');
const TokenGenerator = require('../utils/TokenGenerator');

const toPublshRow = (r) => {
  const {
    countryCode,
    menuKey,
    menuGroup,
    title,
    iconUrl,
    usageType,
    path,
    externalLink,
    externalLinkTarget,
    imageUrls,
    handleFunction,
    special,
  } = r;
  return {
    countryCode,
    menuKey,
    menuGroup,
    title,
    iconUrl,
    usageType,
    path: usageType === 'path' ? path : null,
    externalLink: usageType === 'externalLink' ? externalLink : null,
    externalLinkTarget:
      usageType === 'externalLink' ? externalLinkTarget : null,
    imageUrls: usageType === 'imageUrls' ? imageUrls : null,
    handleFunction: usageType === 'handleFunction' ? handleFunction : null,
    special: usageType === 'special' ? special : null,
  };
};

const checkShowtime = (showtimeDateValue, value, unit) => {
  let now = new Date();
  now = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  let compareDate = new Date(
    showtimeDateValue.getFullYear(),
    showtimeDateValue.getMonth(),
    showtimeDateValue.getDate(),
    0,
    0,
    0,
    0
  );
  compareDate =
    unit === 'DAY'
      ? new Date(compareDate.setDate(compareDate.getDate() + value))
      : unit === 'MONTH'
      ? new Date(compareDate.setMonth(compareDate.getMonth() + value))
      : unit === 'YEAR'
      ? new Date(compareDate.setFullYear(compareDate.getFullYear() + value))
      : null;

  if (compareDate) {
    return value < 0
      ? now >= compareDate && now <= showtimeDateValue
      : now <= compareDate && now >= showtimeDateValue;
  } else {
    return false;
  }
};

const getOne = async (e) => {
  try {
    const { id } = e.pathParameters || {};
    const data = await MenuService.getById(id);

    return data
      ? createResponse(httpStatus.ok, { data })
      : createResponse(httpStatus.notFound, { message: 'NotFound.' });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
    });
  }
};

const getList = async (e) => {
  try {
    const { countryCode } = e.queryStringParameters || {};

    let options = {};
    if (countryCode) {
      const {
        error: errorValidateCountryCode,
        value: countryCodeValid,
      } = validateInput(countryCode, GeneralSchema.VALID_COUNTRY);
      if (errorValidateCountryCode)
        return createResponse(httpStatus.badRequest, {
          message: errorValidateCountryCode.message,
        });
      options = {
        ...options,
        equalAnd: {
          countryCode: countryCodeValid,
        },
      };
    }

    const data = await MenuService.getList(options);
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
    });
  }
};

const create = async (e) => {
  try {
    const { Authorization } = e.headers;
    const body = parseBodyJSON(e.body);

    // Check Full Access
    const decodedData = PermissionHelpers.getDecodeToken(Authorization);
    const { isFullAccess } = decodedData;
    if (!isFullAccess)
      return createResponse(httpStatus.forbidden, {
        message: 'Access require',
      });

    const { error: errorValidateBody, value: validatedBody } = validateInput(
      body,
      MenuSchema.CREATE
    );
    if (errorValidateBody)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateBody.message,
      });

    const { username: createdBy } = decodedData;
    const createdAt = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 22);
    const updatedBy = createdBy;
    const updatedAt = createdAt;

    const newData = {
      ...validatedBody,
      createdBy,
      createdAt,
      updatedBy,
      updatedAt,
    };

    const result = await MenuService.create(newData);
    const { insertId } = result || {};
    const data = await MenuService.getById(insertId);
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    const { code, message } = err;
    const errStatus =
      code === 'ER_DUP_ENTRY'
        ? httpStatus.Conflict
        : httpStatus.InternalServerError;
    return createResponse(errStatus, { message });
  }
};

const edit = async (e) => {
  try {
    const { Authorization } = e.headers;
    const body = parseBodyJSON(e.body);
    const input = Array.isArray(body) ? body : [body];

    // Check full access
    const decodedData = PermissionHelpers.getDecodeToken(Authorization);
    const { isFullAccess } = decodedData;
    if (!isFullAccess)
      return createResponse(httpStatus.forbidden, {
        message: 'Access require',
      });

    // Check schema
    const { error: errorValidateInput, value: validatedInput } = validateInput(
      input,
      MenuSchema.EDIT_MULTIPLE
    );
    if (errorValidateInput)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateInput.message,
      });

    // Check no edit data
    const noEditDataList = input.filter(
      ({ id, ...cols }) => Object.keys(cols).length < 1
    );
    if (noEditDataList.length > 0)
      return createResponse(httpStatus.badRequest, {
        message: 'At least 1 edit data.',
        error: { data: noEditDataList },
      });

    // Check NotFound Data
    const listOfInputId = validatedInput.map(({ id }) => id);
    const existsData = await MenuService.getList({
      inAnd: { id: listOfInputId },
    });
    const listOfExistId = existsData.map((r) => r.id);
    const notFoundData = validatedInput.filter(
      (r) => !listOfExistId.includes(r.id)
    );
    if (notFoundData.length > 0)
      return createResponse(httpStatus.notFound, {
        message: 'NotFound.',
        error: { data: notFoundData.map((r) => r.id) },
      });

    // Save
    const { username: updatedBy } = decodedData;
    const updatedAt = new Date().toISOString();
    const editDataList = validatedInput.map((r) => ({
      updatedBy,
      updatedAt,
      ...r,
    }));
    await MenuService.editMultiple(editDataList);

    const data = await MenuService.getList({ inAnd: { id: listOfInputId } });
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, { message: err });
  }
};

const deleteOne = async (e) => {
  try {
    const { Authorization } = e.headers;
    const { id } = e.pathParameters || {};
    const { affectedRows } = await MenuService.deleteById(id);

    // Check full access
    const decodedData = PermissionHelpers.getDecodeToken(Authorization);
    const { isFullAccess } = decodedData;
    if (!isFullAccess)
      return createResponse(httpStatus.forbidden, {
        message: 'Access require',
      });

    return affectedRows
      ? createResponse(httpStatus.ok, { data: affectedRows })
      : createResponse(httpStatus.notFound, { message: 'NotFound.' });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, { message: err });
  }
};

const getPublish = async (e) => {
  try {
    const { countryCode } = e.pathParameters || {};

    const {
      error: errorValidateCountryCode,
      value: countryCodeValid,
    } = validateInput(countryCode, GeneralSchema.VALID_COUNTRY);
    if (errorValidateCountryCode)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateCountryCode.message,
      });

    const { error: errorParams, value: paramsValid } = validateInput(
      e.queryStringParameters || {},
      MenuSchema.GET_PUBLISH
    );
    if (errorParams)
      return createResponse(httpStatus.badRequest, {
        message: errorParams.message,
      });

    const {
      baId,
      token,
      status = null,
      rank = null,
      showtimeDate = null,
      userCountry = null,
    } = paramsValid;

    const isPublic = !baId && !token && !status && !rank;

    let menuList = [];
    if (isPublic) {
      menuList = await MenuService.getList({
        equalAnd: {
          countryCode: countryCodeValid,
          isEnable: 1,
          isLoginRequired: 0,
        },
      });
    } else {
      const isValidToken = TokenGenerator.validate(baId, token);
      if (!isValidToken)
        return createResponse(httpStatus.forbidden, {
          message: 'invalid token.',
        });

      const showtimeDateValue = !isNaN(Date.parse(showtimeDate))
        ? new Date(showtimeDate)
        : null;
      if (showtimeDate && !showtimeDateValue)
        return createResponse(httpStatus.badRequest, {
          message: 'invalid showtimeDate.',
        });

      menuList = await MenuService.getList({
        equalAnd: {
          countryCode: countryCodeValid,
          isEnable: 1,
        },
      });

      menuList = menuList
        .filter(({ allowOnlyStatus }) =>
          allowOnlyStatus.length > 0 ? allowOnlyStatus.includes(status) : true
        )
        .filter(({ allowOnlyRank }) =>
          allowOnlyRank.length > 0 ? allowOnlyRank.includes(rank) : true
        )
        .filter(({ allowOnlyBa }) =>
          allowOnlyBa.length > 0 ? allowOnlyBa.includes(baId) : true
        )
        .filter(({ allowOnlyMarket }) =>
          allowOnlyMarket.length > 0
            ? allowOnlyMarket.includes(userCountry)
            : true
        )
        .filter(({ isDisableOnLogin }) => !isDisableOnLogin)
        .filter((r) => {
          const { showtimeBefore } = r;
          const { value, unit } = showtimeBefore;
          const hasShowtime = value && unit;
          const isAllow = hasShowtime
            ? showtimeDateValue
              ? checkShowtime(showtimeDateValue, -value, unit)
              : false
            : true;

          return isAllow;
        })
        .filter((r) => {
          const { showtimeAfter } = r;
          const { value, unit } = showtimeAfter;
          const hasShowtime = value && unit;
          const isAllow = hasShowtime
            ? showtimeDateValue
              ? checkShowtime(showtimeDateValue, value, unit)
              : false
            : true;
          return isAllow;
        });
      // .filter(r => r.isOnlyCountryUser ? r.countryCode === userCountry : true)
    }

    const menuListOnlyAB = menuList.filter((r) =>
      ['A', 'B'].includes(r.menuGroup)
    );
    const maxGroupIndex = Math.ceil(menuListOnlyAB.length / 2) - 1;

    const mobile = menuListOnlyAB.map(toPublshRow);
    const desktop = menuListOnlyAB
      .map((r, index) => ({
        ...r,
        menuGroup: index <= maxGroupIndex ? 'A' : 'B',
      }))
      .map(toPublshRow);
    const others = menuList
      .filter((r) => !['A', 'B'].includes(r.menuGroup))
      .reduce((obj, r) => {
        const { menuKey } = r;
        return {
          ...(obj ? obj : {}),
          [menuKey]: toPublshRow(r),
        };
      }, {});

    const header = menuList
      .filter((r) => r.isHeaderMenu)
      .sort((r1, r2) =>
        r1.sortingHeader > r2.sortingHeader
          ? 1
          : r1.sortingHeader < r2.sortingHeader
          ? -1
          : 0
      )
      .map(toPublshRow);

    const data = { header, desktop, mobile, others };
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, { message: err });
  }
};

const getListTest = async (e) => {
  const data = {
    test: true,
  };
  return createResponse(httpStatus.ok, { data });
};

module.exports = {
  getOne,
  getList,
  create,
  edit,
  deleteOne,
  getPublish,
  getListTest,
};
