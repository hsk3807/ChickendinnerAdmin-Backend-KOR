const { createResponse, httpStatus, parseBodyJSON } = require('../utils/helpers')
const { validateInput } = require('../utils/validator')
const CartSchema = require("../schema/cartSchema")
const TokenGenerator = require("../utils/GenealogyTokenGenerator")
const firebase = require("../utils/firebaseDatabase")

const setItems = async e => {
    try {
        // Validate params
        const {
            baId,
            countryCode,
            cartType,
        } = e.pathParameters || {}
        const { 
            token 
        } = e.queryStringParameters || {}

        const { error: errorValidatParams, value: paramsValid } = validateInput({
            baId,
            countryCode,
            cartType,
        }, CartSchema.PATH_PARAMS)
        if (errorValidatParams) return createResponse(httpStatus.badRequest, { message: errorValidatParams.message })
       
        if (!token) return createResponse(httpStatus.forbidden, { message: "token required." });
        const isValidToken = TokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        // Validate body
        const body = parseBodyJSON(e.body)
        const { error: errorValidateBody, value: validatedBody } = validateInput(body, CartSchema.BODY)
        if (errorValidateBody) return createResponse(httpStatus.badRequest, { message: errorValidateBody.message })

        const {
            baId: baIdValid,
            countryCode: countryCodeValid,
            cartType: cartTypeValid,
        } = paramsValid
        const refCart = `carts/${baIdValid}/${countryCodeValid}/${cartTypeValid}`

        const data = await firebase.ref(refCart).set(validatedBody)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const getItems = async e => {
    try {
        // Validate params
        const {
            baId,
            countryCode,
            cartType,
        } = e.pathParameters || {}
        const { error: errorValidatParams, value: paramsValid } = validateInput({
            baId,
            countryCode,
            cartType,
        }, CartSchema.PATH_PARAMS)
        if (errorValidatParams) return createResponse(httpStatus.badRequest, { message: errorValidatParams.message })

        const { token } = e.queryStringParameters || {}
        if (!token) return createResponse(httpStatus.forbidden, { message: "token required." });
        const isValidToken = TokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        const {
            baId: baIdValid,
            countryCode: countryCodeValid,
            cartType: cartTypeValid,
        } = paramsValid
        const refCart = `carts/${baIdValid}/${countryCodeValid}/${cartTypeValid}`

        const data = await firebase.ref(refCart).once('value')
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}

const setCartItem = async e => {
    try {
        const {
            baId,
            countryCode,
            cartType,
            action,
        } = e.pathParameters || {}
        
        const { token } = e.queryStringParameters || {}
        const body = parseBodyJSON(e.body) || {}
    
        const { error: errorValidatParams, value: paramsValid } = validateInput({
            baId,
            countryCode,
            cartType,
        }, CartSchema.PATH_PARAMS)
        if (errorValidatParams) return createResponse(httpStatus.badRequest, { message: errorValidatParams.message })

        if (!token) return createResponse(httpStatus.forbidden, { message: "token required." });
        const isValidToken = TokenGenerator.validate(baId, token)
        if (!isValidToken) return createResponse(httpStatus.forbidden, { message: "token invalid." });

        const { error: errorValidatBody, value: bodyValid } = validateInput(body, CartSchema.CART_ITEM)
        if (errorValidatBody) return createResponse(httpStatus.badRequest, { message: errorValidatBody.message })    
        
        const { error: errorValidataAction, value: {action: actionValid} } = validateInput({action}, CartSchema.SET_ITEM_ACTIONS)
        if (errorValidataAction) return createResponse(httpStatus.badRequest, { message: errorValidataAction.message })    

        const {
            baId: baIdValid,
            countryCode: countryCodeValid,
            cartType: cartTypeValid,
        } = paramsValid
        const refCart = `carts/${baIdValid}/${countryCodeValid}/${cartTypeValid}`
        const cartResponse = await firebase.ref(refCart).once('value')
        const currentCart = cartResponse ? JSON.parse(JSON.stringify(cartResponse)) : {}

        const { item_code, qty } = bodyValid
        const items = Object.keys(currentCart).map(key => currentCart[key])
        const foundItemIndex = items.findIndex(r => r.item_code === item_code)

        if (foundItemIndex > -1){
            let updateQty = null
            switch (actionValid){
                case"add":
                    updateQty = items[foundItemIndex].qty + qty 
                    break;
                case "set":
                    updateQty = qty
                    break;
            }

            if (updateQty !== null){
                if (Math.abs(updateQty) > 0) {
                    items[foundItemIndex].qty = updateQty
                } else {
                    items.splice(foundItemIndex, 1)
                }
            }
        }else{
            if (qty > 0) {
                items.push({ item_code, qty })
            }
        }
        
        const data = await firebase.ref(refCart).set(items)
        return createResponse(httpStatus.ok, { data })
    } catch (err) {
        console.error(err)
        return createResponse(httpStatus.InternalServerError, { message: err.message })
    }
}


module.exports = {
    setItems,
    getItems,    
    setCartItem,
}