const { sitesConfig } = require('lib-global-configs');
const Joi = require('joi');
const listOfCountryCode = Object.keys(sitesConfig);

module.exports.VALID_COUNTRY = Joi.string()
  .uppercase()
  .valid(...listOfCountryCode);
module.exports.COUNTRY_OBJECT = {
  countryCode: Joi.string()
    .uppercase()
    .valid(...listOfCountryCode),
};
