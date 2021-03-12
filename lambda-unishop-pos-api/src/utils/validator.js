const { httpStatus } = require('./helpers')

module.exports.validateInput = (object, schema) => {
    let error, value

    const result = schema.validate(object)
    const { error: errorValidate, value: validatedObject } = result || {}

    if (errorValidate) {
        const message = errorValidate.details.map(r => `[${r.path.toString()}] ${r.message}`).join(", ")
        error = {
            message,
            errorValidate,
            httpStatus: httpStatus.badRequest
        }
    } else {
        value = validatedObject
    }

    return { error, value }
}