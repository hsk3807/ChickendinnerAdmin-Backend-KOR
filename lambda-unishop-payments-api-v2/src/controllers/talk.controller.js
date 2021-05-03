const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const TalkService = require('../services/talk.service');
const { ResultCode, CommonCode } = require('../code');

const send = catchAsync(async (req, res) => {
  let dstaddr = '';
  let variable = '면접자|2021.01.25|12:30|플러스하이';
  let type = '';

  try {
    if (req.body) {
      dstaddr = req.body.dstaddr;
      variable = req.body.variable;
    }
  } catch (err) {}

  const data = await TalkService.send(req.body);

  if (data.result !== '100')
    return res.r(
      data,
      new ResultCode().getCodeMsg(CommonCode.COMMON_1001_CODE)
    );

  return res.r(undefined);
});

module.exports = {
  send,
};
