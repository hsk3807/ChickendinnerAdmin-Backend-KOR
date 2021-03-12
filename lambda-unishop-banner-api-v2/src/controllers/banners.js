const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const PermissionHelpers = require("../utils/permissionHelpers")
const { validateInput } = require('../utils/validator')
const GeneralSchema = require("../schema/generalSchema")
const bannersSchema = require('../schema/bannersSchema')
const BannerService = require("../services/BannerService")
const TokenGenerator = require("../utils/TokenGenerator")
const ACCESS = require('../utils/accessConfig')

const getListAdmin = async e => {
  try {
    const { country_code } = e.pathParameters || {}
    let options = {}
    if (country_code) {
      const { error: errorValidateCountryCode, value: countryCodeValid } = validateInput(country_code, GeneralSchema.VALID_COUNTRY)
      if (errorValidateCountryCode) return createResponse(httpStatus.badRequest, { message: errorValidateCountryCode.message })
      options = {
        ...options,
        equalAnd: {
          countryCode: countryCodeValid
        }
      }
    }
    let data = {
      arrow: undefined,
      banners: []
    }

    let result_arrow = await BannerService.getArrow()
    data.arrow = JSON.parse(result_arrow[0].url)
    data.banners = await BannerService.getList(options)
    return createResponse(httpStatus.ok, { data })

  } catch (err) {
    console.error(err)
    const { code, message } = err
    const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
    return createResponse(errStatus, { message })
  }
}

const getOne = async e => {
  try {
    const { id } = e.pathParameters || {}
    const data = await BannerService.getById(id)

    return data
      ? createResponse(httpStatus.ok, { data })
      : createResponse(httpStatus.notFound, { message: "NotFound." })
  } catch (err) {
    console.error(err)
    return createResponse(httpStatus.InternalServerError, { message: err.message })
  }
}

const editArrow = async e => {
  try {
    const arrow = e.body
    await BannerService.editArrow(arrow)
    const data = {
      success: true
    }
    return createResponse(httpStatus.ok, { data })
  } catch (err) {
    console.error(err)
    return createResponse(httpStatus.InternalServerError, { message: err.message })
  }
}

const getListUser = async e => {
  try {
    const { country_code } = e.pathParameters || {}
    const { baId, token } = e.queryStringParameters || {}
    // let options = {}
    // if (country_code) {
    const { error: errorValidateCountryCode, value: countryCodeValid } = validateInput(country_code, GeneralSchema.VALID_COUNTRY)
    if (errorValidateCountryCode) return createResponse(httpStatus.badRequest, { message: errorValidateCountryCode.message })
    // options = {
    //   ...options,
    //   equalAnd: {
    //     countryCode: countryCodeValid,
    //     isEnable: 1,
    //   }
    // }
    // }

    const isPublic = !baId && !token

    // show only after login isLoginRequired 1, isDisableOnLogin

    let result1 = await BannerService.getArrow()
    if (isPublic) { // no login
      result = await BannerService.getListPublic({
        equalAnd: {
          countryCode: countryCodeValid,
          isEnable: 1,
          isLoginRequired: 0,
        }
      })

    } else { // login
      const isValidToken = TokenGenerator.validate(baId, token)
      if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "invalid token." });
      result = await BannerService.getListPublic({
        equalAnd: {
          countryCode: countryCodeValid,
          isEnable: 1,
          isDisableOnLogin: 0
        }
      })
    }

    let data = {
      arrow: undefined,
      banners: []
    }
    data.arrow = JSON.parse(result1[0].url)
    result.forEach((element) => {
      // console.log('element', element)
      // if (!element.isDisableOnLogin) {
      data.banners.push({
        id: element.id,
        bannerImageUrl: element.bannerImageUrl,
        usageType: element.usageType,
        path: element.path,
        externalLinkTarget: element.externalLinkTarget,
        externalLink: element.externalLink,
        imageUrls: element.imageUrls,
        handleFunction: element.handleFunction
      })
      // }
    })

    return createResponse(httpStatus.ok, { data })
  } catch (err) {
    console.error(err)
    const { code, message } = err
    const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
    return createResponse(errStatus, { message })
  }
}

const create = async e => {
  try {
    const { Authorization } = e.headers
    const body = parseBodyJSON(e.body)

    const { countryCode } = body
    const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
    if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })
    // const decodedData = PermissionHelpers.getDecodeToken(Authorization)
    // const { isFullAccess } = decodedData
    // if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

    const { error: errorValidateBody, value: validatedBody } = validateInput(body, bannersSchema.CREATE)
    if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

    const { username: createdBy } = decodedData
    const createdAt = new Date().toISOString().replace("T", " ").substring(0, 22)
    const updatedBy = createdBy
    const updatedAt = createdAt

    const newData = {
      ...validatedBody,
      createdBy,
      createdAt,
      updatedBy,
      updatedAt
    }

    const result = await BannerService.create(newData)
    const { insertId } = result || {}
    const data = await BannerService.getById(insertId)
    return createResponse(httpStatus.ok, { data })

  } catch (err) {
    console.error(err)
    const { code, message } = err
    const errStatus = code === "ER_DUP_ENTRY" ? httpStatus.Conflict : httpStatus.InternalServerError
    return createResponse(errStatus, { message })
  }

}

const edit = async e => {
  try {
    const { Authorization } = e.headers
    const body = parseBodyJSON(e.body)
    const input = Array.isArray(body) ? body : [body]

    // Check full access
    const { countryCode } = input[0]
    const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
    if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })
    // const decodedData = PermissionHelpers.getDecodeToken(Authorization)
    // const { isFullAccess } = decodedData
    // if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

    // Check schema
    const { error: errorValidateInput, value: validatedInput } = validateInput(input, bannersSchema.EDIT_MULTIPLE)
    if (errorValidateInput) return createResponse(httpStatus.badRequest, { message: errorValidateInput.message })

    // Check no edit data
    const noEditDataList = input.filter(({ id, ...cols }) => Object.keys(cols).length < 1)
    if (noEditDataList.length > 0) return createResponse(
      httpStatus.badRequest,
      { message: "At least 1 edit data.", error: { data: noEditDataList } }
    )

    // Check NotFound Data
    const listOfInputId = validatedInput.map(({ id }) => id)
    const existsData = await BannerService.getList({ inAnd: { id: listOfInputId } })
    const listOfExistId = existsData.map(r => r.id)
    const notFoundData = validatedInput.filter(r => !listOfExistId.includes(r.id))
    if (notFoundData.length > 0) return createResponse(
      httpStatus.notFound,
      { message: "NotFound.", error: { data: notFoundData.map(r => r.id) } }
    )

    const { username: updatedBy } = decodedData
    const updatedAt = new Date().toISOString()
    const editDataList = validatedInput.map(r => ({ updatedBy, updatedAt, ...r }))
    await BannerService.editMultiple(editDataList)

    const data = await BannerService.getList({ inAnd: { id: listOfInputId } })
    return createResponse(httpStatus.ok, { data })

  } catch (err) {
    console.error(err)
    return createResponse(httpStatus.InternalServerError, { message: err })
  }
}

const deleteOne = async e => {
  try {
    const { Authorization } = e.headers
    const { id } = e.pathParameters || {}
    const data = await BannerService.getById(id)

    const countryCode = data.countryCode

    const { isAllow, decodedData } = PermissionHelpers.checkAllow(e, countryCode, process.env.MODULE_KEY, ACCESS.WRITE)
    if (!isAllow) return createResponse(httpStatus.forbidden, { message: 'Access require' })
    // Check full access
    // const decodedData = PermissionHelpers.getDecodeToken(Authorization)
    // const { isFullAccess } = decodedData
    // if (!isFullAccess) return createResponse(httpStatus.forbidden, { message: 'Access require' })

    const { affectedRows } = await BannerService.deleteById(id)
    return affectedRows
      ? createResponse(httpStatus.ok, { data: affectedRows })
      : createResponse(httpStatus.notFound, { message: "NotFound." })
  } catch (err) {
    console.error(err)
    return createResponse(httpStatus.InternalServerError, { message: err })
  }
}

module.exports = {
  getOne,
  getListAdmin,
  getListUser,
  create,
  edit,
  deleteOne,
  editArrow
}