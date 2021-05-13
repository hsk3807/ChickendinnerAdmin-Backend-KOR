const {
  createResponse,
  httpStatus,
  parseBodyJSON,
} = require('../utils/helpers');
const PermissionHelpers = require('../utils/permissionHelpers');
const { validateInput } = require('../utils/validator');
const ProductServie = require('../services/productService');
const WarehouseServie = require('../services/productWarehouseService');
const CategoryService = require('../services/productCategoryService');
const TagService = require('../services/productTagService');
const InventoryService = require('../services/productInventoryService');
const GeneralSchema = require('../schema/generalSchema');
const ProductSchema = require('../schema/productSchema');
const { getNativeLanguageCode } = require('../utils/dataTransformHelper');
const ACCESS = require('../utils/accessConfig');

const mappingPrice = {
  A: 'wholesale',
  B: 'wholesale',
  C: 'retail',
  E: 'employee',
  F: 'employee',
  H: 'wholesale',
  L: 'wholesale',
  P: 'preferred',
};

const mappingOriginalPrice = {
  P: 'retail',
};

const displayPVStatuses = {
  A: true,
  B: true,
};

const systemTags = {
  backorder: 'backorder',
  out_of_stock: 'out_of_stock',
};

const mapPriceByStatus = (status) =>
  mappingPrice[status] ? mappingPrice[status] : null;
const mapOriginalPriceByStatus = (status) =>
  mappingOriginalPrice[status] ? mappingOriginalPrice[status] : null;

const mapChildObj = (r, dataset) => {
  const { categoriesList = [], tagsList = [], inventoryList = [] } =
    dataset || {};

  const {
    list_of_category_id,
    list_of_tag_id,
    list_of_inventory_id,
    ...otherColumns
  } = r;
  const categories = list_of_category_id.map((id) =>
    categoriesList.find((c) => c.id === id)
  );
  const tags = list_of_tag_id.map((id) => tagsList.find((t) => t.id === id));
  const inventory = list_of_inventory_id.map((id) =>
    inventoryList.find((i) => i.id === id)
  );

  let system_tags = [];
  if (r.is_starter_kit) {
    const starterKitTag = tagsList.find((r) => r.name === 'starter_kit');
    system_tags.push(starterKitTag);
  }
  if (r.is_renewal) {
    const renewalTag = tagsList.find((r) => r.name === 'renewal');
    system_tags.push(renewalTag);
  }

  return {
    ...otherColumns,
    list_of_inventory_id,
    inventory,
    list_of_category_id,
    categories,
    list_of_tag_id,
    tags,
    system_tags,
  };
};

const toPublishData = (r, { status, tagBackOrder, tagOutOfStock }) => {
  const qty_sellable = r.is_service_item ? 99 : r.qty.available - r.qty.buffer;
  const isOutOfStock = qty_sellable < 1;
  const isBackOrder = qty_sellable < 1 && r.is_allow_backorder;
  const productStatus = isBackOrder
    ? systemTags.backorder
    : isOutOfStock
    ? systemTags.out_of_stock
    : null;
  const system_tags = isBackOrder
    ? [tagBackOrder]
    : isOutOfStock
    ? [tagOutOfStock]
    : [];

  const price = r.price[mapPriceByStatus(status)];
  const price_original = r.price[mapOriginalPriceByStatus(status)] || null;
  const discount_amount = price_original ? price_original - price : null;

  return {
    id: r.id,
    warehouse: r.warehouse_name,
    is_enable: r.is_enable,
    is_liquefy: r.is_liquefy,
    enable_allowbackorder: r.is_allow_backorder,
    country_code: r.country_code,
    item_code: r.item_code,
    product_sorting: r.product_sorting,
    item_name: r.item_name,
    item_info_list: r.item_info_list,
    tags_list: r.tags_list,
    price,
    price_original,
    discount_amount,
    pv: displayPVStatuses[status] ? r.pv : null,
    is_best: r.is_best,
    is_new: r.is_new,
    max_order_cnt: r.max_order_cnt,
    item_link: r.item_link,
    qty_sellable: r.is_allow_backorder ? 99 : qty_sellable,
    image_url: r.image_url,
    remarks: r.remarks,
    categories: r.categories,
    tags: r.tags,
    status: productStatus,
    system_tags,
    down_category_id: r.down_category_id,
    category_id: r.category_id,
    delay_phrase: r.delay_phrase,
    is_delay_chk: r.is_delay_chk,
    is_pack: r.is_pack,
    qty: r.qty
  };
};

const getOne = async (e) => {
  try {
    const { id } = e.pathParameters || {};
    const product = await ProductServie.getById(id);

    if (product) {
      const {
        country_code,
        list_of_category_id: inListOfId,
        list_of_tag_id: inListOfTagId,
        list_of_inventory_id: listOfInvenrotyId,
      } = product;
      const nativeLanguageCode = getNativeLanguageCode(country_code);

      const categoriesList =
        inListOfId.length > 0
          ? await CategoryService.getList({ country_code, inListOfId })
          : [];
      const tagsList =
        inListOfTagId.length > 0
          ? await TagService.getListDisplayNative(nativeLanguageCode, {
              inListOfTagId,
            })
          : [];
      const inventoryList = await WarehouseServie.getInventoryList({
        listOfId: listOfInvenrotyId,
      });
      const data = mapChildObj(product, {
        categoriesList,
        tagsList,
        inventoryList,
      });

      return createResponse(httpStatus.ok, { data });
    } else {
      return createResponse(httpStatus.notFound, { message: 'NotFound.' });
    }
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
    });
  }
};

const getList = async (e) => {
  try {
    const {
      category_id: list_of_category_id,
      tag_id: list_of_tag_id,
    } = e.multiValueQueryStringParameters;
    const { country_code, is_archive, skip, limit } = e.queryStringParameters;

    const inputParams = {
      country_code,
      list_of_category_id,
      list_of_tag_id,
      is_archive,
      skip,
      limit,
    };

    const { error: errorValidateParams, value: pararmsValid } = validateInput(
      inputParams,
      ProductSchema.GET_LIST
    );
    if (errorValidateParams)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateParams.message,
      });

    const {
      country_code: countryCodeValid,
      list_of_category_id: listOfCategoryIdValid,
      list_of_tag_id: listOfTagIdValid,
    } = pararmsValid;
    const nativeLanguageCode = getNativeLanguageCode(countryCodeValid);

    const [productsList, categoriesList, tagsList] = await Promise.all([
      ProductServie.getList(pararmsValid),
      CategoryService.getList(pararmsValid),
      TagService.getListDisplayNative(nativeLanguageCode),
    ]);

    const listOfInvenrotyId = productsList.reduce(
      (list, r) => [...list, ...r.list_of_inventory_id],
      []
    );
    const inventoryList = await WarehouseServie.getInventoryList({
      listOfId: listOfInvenrotyId,
    });

    const items = productsList
      .map((r) => mapChildObj(r, { categoriesList, tagsList, inventoryList }))
      .filter((r) => {
        const isHasCategory =
          listOfCategoryIdValid.length > 0
            ? r.list_of_category_id.some((cateId) =>
                listOfCategoryIdValid.includes(cateId)
              )
            : true;
        return isHasCategory;
      })
      .filter((r) => {
        const isHasTag =
          listOfTagIdValid.length > 0
            ? r.list_of_tag_id.some((tagId) => listOfTagIdValid.includes(tagId))
            : true;
        return isHasTag;
      });

    const data = { pararmsValid, items };
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
    const body = parseBodyJSON(e.body);

    const { error: errorValidateBody, value: validatedBody } = validateInput(
      body,
      ProductSchema.NEW_DATA
    );
    if (errorValidateBody)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateBody.message,
      });

    const { country_code, inventory, ...productData } = validatedBody;
    const { isAllow, decodedData } = PermissionHelpers.checkAllow(
      e,
      country_code,
      process.env.MODULE_KEY,
      ACCESS.WRITE
    );
    if (!isAllow)
      return createResponse(httpStatus.Unauthorized, {
        message: `Access Deny`,
      });

    const { username: created_by } = decodedData;
    const created_at = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 22);
    const newData = {
      country_code,
      created_by,
      created_at,
      updated_by: created_by,
      updated_at: created_at,
      ...productData,
    };

    const results = await ProductServie.create(newData);
    const { insertId: product_id } = results;
    const newInventory = inventory.map((r) => ({ ...r, product_id }));
    const inventoryResults = await InventoryService.createMultiple(
      newInventory
    );

    const data = {
      ...results,
      inventoryResults,
    };
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
    });
  }
};

const editMultiple = async (e) => {
  try {
    const body = parseBodyJSON(e.body);
    const bodyArray = Array.isArray(body) ? body : [body];

    const { error: errorValidateBody, value: validatedBody } = validateInput(
      bodyArray,
      ProductSchema.EDIT_DATA_ARRAY
    );
    if (errorValidateBody)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateBody.message,
      });

    const permissionCheckList = validatedBody.map(({ id, country_code }) => {
      const { isAllow, decodedData } = PermissionHelpers.checkAllow(
        e,
        country_code,
        process.env.MODULE_KEY,
        ACCESS.WRITE
      );
      const { username } = decodedData || {};
      return {
        id,
        country_code,
        isAllow,
        username,
      };
    });
    const denyPermissionList = permissionCheckList.filter((r) => !r.isAllow);
    if (denyPermissionList.length > 0)
      return createResponse(httpStatus.Unauthorized, {
        message: `Access Deny`,
        error: { data: denyPermissionList },
      });

    const updated_at = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 22);
    const editDataList = validatedBody.map((r) => {
      const { inventory, ...otherProps } = r;
      const { username: updated_by } = permissionCheckList.find(
        (p) => p.id === r.id && p.country_code === r.country_code
      );
      return { ...otherProps, updated_at, updated_by };
    });
    const editInventory = validatedBody.reduce((list, r) => {
      const { inventory = [] } = r;
      return [...list, ...inventory];
    }, []);

    const processExcutes = [ProductServie.editMultiple(editDataList)];
    if (editInventory.length > 0)
      processExcutes.push(InventoryService.editMultiple(editInventory));

    await Promise.all(processExcutes);

    const data = {};
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
    });
  }
};

const remove = async (e) => {
  try {
    const { id } = e.pathParameters || {};
    const [product, inventories] = await Promise.all([
      ProductServie.getById(id),
      InventoryService.getList({ listOfProductId: [id] }),
    ]);
    if (!product)
      return createResponse(httpStatus.notFound, { message: `Not found.` });

    const { country_code } = product;
    const { isAllow } = PermissionHelpers.checkAllow(
      e,
      country_code,
      process.env.MODULE_KEY,
      ACCESS.WRITE
    );
    if (!isAllow)
      return createResponse(httpStatus.Unauthorized, {
        message: `Access Deny`,
      });

    const results = await ProductServie.remove(product);
    const listOfInventoryId = inventories.map((r) => r.id);
    const inventoryResults =
      listOfInventoryId.length > 0
        ? await InventoryService.removeByIdMultiple(listOfInventoryId)
        : null;

    const data = {
      results,
      inventoryResults,
    };
    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
    });
  }
};

const getPublish = async (e) => {
  try {
    const { countryCode } = e.pathParameters || {};
    const {
      status,
      allow,
      warehouse = 'Main',
      onlyHasPrice,
      onlyEnable,
      isTagNative = '1',
    } = e.queryStringParameters || {};

    const { item_code } = e.multiValueQueryStringParameters || {};

    const {
      error: errorValidateCountryCode,
      value: countryCodeValid,
    } = validateInput(countryCode, GeneralSchema.VALID_COUNTRY);
    if (errorValidateCountryCode)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateCountryCode.message,
      });

    const { error: errorValidateParams, value: pararmsValid } = validateInput(
      {
        status,
        allow,
        warehouse,
        onlyHasPrice,
        onlyEnable,
        item_code,
      },
      ProductSchema.GET_PUBLISH
    );
    if (errorValidateParams)
      return createResponse(httpStatus.badRequest, {
        message: errorValidateParams.message,
      });

    const {
      allow: allowValid,
      status: statusValid,
      warehouse: warehouseValid,
      onlyHasPrice: onlyHasPriceValid,
      onlyEnable: onlyEnableValid,
      item_code: listOfItemCode,
    } = pararmsValid;

    const nativeLanguageCode = getNativeLanguageCode(countryCodeValid);
    const allow_key = `allow_${allowValid}`;
    const [
      productsList,
      categoriesList,
      tagsList,
      warehousesList,
    ] = await Promise.all([
      ProductServie.getList({
        country_code: countryCodeValid,
        is_archive: false,
        [allow_key]: true,
        listOfItemCode,
        limit: 9999,
      }),
      CategoryService.getList(pararmsValid),
      isTagNative === '1'
        ? TagService.getListDisplayNative(nativeLanguageCode)
        : TagService.getList(),
      WarehouseServie.getList({ country_code: countryCodeValid }),
      WarehouseServie.countRequest(countryCodeValid),
    ]);

    const listOfInvenrotyId = productsList.reduce(
      (list, r) => [...list, ...r.list_of_inventory_id],
      []
    );
    const inventoryList = await WarehouseServie.getInventoryList({
      listOfId: listOfInvenrotyId,
    });

    const mapWarehouseProducts = productsList
      .map((r) => mapChildObj(r, { categoriesList, tagsList, inventoryList }))
      .reduce((list, r) => {
        // Choose inventory
        const stock = r.inventory.find(
          (i) => i.warehouse_name === warehouseValid
        );
        if (stock) {
          const {
            is_enable,
            is_allow_backorder,
            updated_qty_at,
            qty,
            warehouse_name,
            warehouse_type,
          } = stock || {};
          return [
            ...list,
            {
              ...r,
              is_enable,
              is_allow_backorder,
              updated_qty_at,
              qty,
              warehouse_name,
              warehouse_type,
            },
          ];
        } else {
          return list;
        }
      }, []);

    const tagBackOrder = tagsList.find((r) => r.name === systemTags.backorder);
    const tagOutOfStock = tagsList.find(
      (r) => r.name === systemTags.out_of_stock
    );

    const productWithChildren = mapWarehouseProducts
      .filter(({ is_enable }) => (onlyEnableValid ? is_enable : true))
      .filter(({ is_soldout }) => (is_soldout ? !is_soldout : true))
      .filter(({ qty }) => (qty.available > 0 ? true : false))
      .filter(({ only_status_list = [] }) =>
        only_status_list.length > 0
          ? only_status_list.includes(statusValid)
          : true
      )
      .map((r) => mapChildObj(r, { categoriesList, tagsList }))
      .sort((r1, r2) =>
        r1.product_sorting > r2.product_sorting
          ? 1
          : r1.product_sorting < r2.product_sorting
          ? -1
          : 0
      );

    const items = productWithChildren
      .filter((r) => (r.is_renewal ? r.is_renewal_sellable : true))
      .filter((r) => (r.is_starter_kit ? r.is_starter_kit_sellable : true))
      .map((r) =>
        toPublishData(r, { status: statusValid, tagBackOrder, tagOutOfStock })
      )
      .filter((r) => (onlyHasPriceValid ? r.price > 0 : true));

    const renewal = productWithChildren
      .filter((r) => r.is_renewal)
      .map((r) =>
        toPublishData(r, { status: statusValid, tagBackOrder, tagOutOfStock })
      )
      .filter((r) => (onlyHasPriceValid ? r.price > 0 : true));

    const starter_kit = productWithChildren
      .filter((r) => r.is_starter_kit)
      .map((r) =>
        toPublishData(r, { status: statusValid, tagBackOrder, tagOutOfStock })
      )
      .filter((r) => (onlyHasPriceValid ? r.price > 0 : true));

    const warehouses = warehousesList.map((r) => r.warehouse_name);
    const warehouseSelected = warehouseValid;
    const data = {
      isTagNative,
      warehouses,
      warehouseSelected,
      items,
      renewal,
      starter_kit,
    };

    return createResponse(httpStatus.ok, { data });
  } catch (err) {
    console.error(err);
    return createResponse(httpStatus.InternalServerError, {
      message: err.message,
    });
  }
};

module.exports = {
  getOne,
  getList,
  create,
  editMultiple,
  remove,
  getPublish,
};
