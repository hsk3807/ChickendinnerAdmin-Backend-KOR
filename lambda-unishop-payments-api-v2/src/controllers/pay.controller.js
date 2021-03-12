const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const PAY_TYPE = {
  CREDIT_CARD: 'CREDIT_CARD',
  BANK_BOOK: 'BANK_BOOK',
  MY_PAY: 'MY_PAY',
};

/**
 * @param {string} payType easypay | kspay | mypay
 */
const upay = catchAsync(async (req, res) => {
  const result = {
    test: 'test',
  };

  console.log('req.body : ', req.body);

  try {
    const body = req.body;
    const { payType, selectedCard } = body;

    switch (payType) {
      case PAY_TYPE.CREDIT_CARD:
        if (Number(selectedCard) === 0) {
          return res.render('easypay', { ...req.body });
        }
        return res.render('kspay_wh', { ...req.body });
        break;

      case PAY_TYPE.BANK_BOOK:
        break;

      default:
        break;
    }
  } catch (err) {}
  //if (req.body) res.send(result);
});

const kspay_wh = catchAsync(async (req, res) => {
  res.render('kspay_wh', { ...req.body });
});
const kspay_wh_result = catchAsync(async (req, res) => {
  res.render('kspay_wh_result', { ...req.body });
});

module.exports = {
  upay,
  kspay_wh,
  kspay_wh_result,
};
