const httpStatus = require("http-status");
const pick = require("../utils/pick");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const PayService = require("../services/pay.service");
const TalkService = require("../services/talk.service");
const { ResultCode, CommonCode } = require("../code");
const Config = require("../env");
const KSPayWebHostBean = require("../classes/KSPayWebHostBean");
const MYPayWebHostBean = require("../classes/MYPayWebHostBean");
const {
  base64Enc,
  base64Dec,
  eucKrToUtf8,
  utf8ToeucKr,
  euckrEnc,
  euckrDec,
  getFullDate,
  get_etoken,
  numberWithCommas,
  getFullDate2,
} = require("../utils");
let iconv = require("iconv-lite");
const { PAY_TYPE, TALK_TEMPLATE_TYPE } = require("../utils/Constants");
const url = require("url");

const getOrderId = (order_id) => {
  try {
    let order_id_tmp = order_id.split("-");
    order_id = order_id_tmp.length === 2 ? order_id_tmp[1] : order_id;
  } catch (err) {}

  return order_id;
};
const sendMessage = async (data, template_code) => {
  const { dstaddr, variable } = getMessageData(data, template_code);
  const res = await TalkService.send({
    dstaddr,
    variable,
    template_code,
  });

  return res;
};

const getMessageData = (data, template_code) => {
  let params = {};

  let {
    order_id,
    bank_name,
    bank_ref,
    backoffice_price,
    stamp_created,
    login_id,
  } = data;
  const request_data = JSON.parse(data.request_data);
  const { mobile, login_native_name, total_pv, orderTermsJson} = request_data.orderData;

  order_id = getOrderId(order_id);

  //가상 계좌 안내
  if (template_code === TALK_TEMPLATE_TYPE.VIRTUAL_ACCOUNT) {
    var stamp_created_dt = new Date(stamp_created);
    stamp_created_dt.setDate(stamp_created_dt.getDate() + 1);

    params = {
      dstaddr: mobile,
      variable: `${order_id}|${bank_name}|${bank_ref}|${orderTermsJson.order.shipToName.firstName}|${numberWithCommas(
        backoffice_price
      )}|${getFullDate2(stamp_created_dt)}`,
    };
  } else {
    //결제완료 안내
    params = {
      dstaddr: mobile,
      variable: `${login_id}|${login_native_name}|${stamp_created.substring(
        0,
        10
      )}|${order_id}|${numberWithCommas(backoffice_price)}|${total_pv}`,
    };
  }

  return params;
};

/**
 * @description 통합모듈 | 마이페이 = Upay 통합결제
 */
const upay = catchAsync(async (req, res) => {
  try {
    const body = req.body;
    const { payType, sndGoodname, sndAmount, reUrl, payData, order } = body;

    let order_id = undefined;

    //공통 validation 체크
    switch (payType) {
      //통합모듈 ( 가상계좌, 신용카드 )
      case PAY_TYPE.VIRTUAL_ACCOUNT:
      case PAY_TYPE.CREDIT_CARD:
        try {
          const res = await PayService.loadOrderDetail(req.body.referenceId);
          if (res) order_id = res.order_id;
        } catch (err) {}

        if (req.useragent.isMobile)
          res.render("kspay_wh_m", {
            ...req.body,
            sndStoreid: Config.upay.storeid,
            sndInstallmenttype: Number(req.body.sndInstallmenttype),
            sndOrdernumber: order_id,
          });
        else
          res.render("kspay_wh", {
            ...req.body,
            sndStoreid: Config.upay.storeid,
            sndInstallmenttype: Number(req.body.sndInstallmenttype),
            sndOrdernumber: order_id,
          });
        break;

      //마이페이
      case PAY_TYPE.MY_PAY:
        const curr_date_14 = getFullDate();
        const p_data =
          curr_date_14 + ":servicetoken=" + Config.mypay.servicetoken;

        const etoken = get_etoken(Config.mypay.mhkey, curr_date_14, "");

        try {
          const res = await PayService.loadOrderDetail(req.body.referenceId);
          if (res) order_id = res.order_id;
        } catch (err) {}

        const params = {
          etoken,
          MYPAY_URL: Config.mypay.url,
          sndStoreid: Config.mypay.storeid,
          sndStoreno: Config.mypay.storeno,
          sndMsalt: Config.mypay.msalt,
          sndMpayMsalt: Config.mypay.mpaymsalt,
          sndOrdernumber: order_id,
        };

        if (req.useragent.isMobile)
          res.render("mypay_order", { ...req.body, ...params });
        else res.render("mypay_order", { ...req.body, ...params });
        break;
    }
  } catch (err) {}

});
const easypay = catchAsync(async (req, res) => {
  try {
    const data = await PayService.easyPay(req.body);

    if (
      !data.hasOwnProperty("rMessage2") ||
      !data.hasOwnProperty("rMessage1")
      // ||
      // !data.hasOwnProperty('json_result')
    ) return res.r(
      undefined,
      new ResultCode().getCodeMsg(CommonCode.COMMON_0005_CODE)
    );
      
    let result = {
      // ...data.json_result,
      message1: data.rMessage1,
      message2: data.rMessage2,
      referenceId : data.referenceId
    };

    if(data.code === 'S'){
    }else{
      return res.r(
        result,
        new ResultCode().getCodeMsg(CommonCode.COMMON_0006_CODE)
      );
    }
    return res.r(result);
  } catch (err) {
    console.log("err : ", err);
    return res.r(
      { error: err },
      new ResultCode().getCodeMsg(CommonCode.COMMON_0005_CODE)
    );
  }
});

/**
 * @description 통합모듈 Popup redirection 처리
 */
const kspay_wh_rcv = catchAsync(async (req, res) => {
  const { reCommConId } = req.body;
  res.render("kspay_wh_rcv", { ...req.body, ...req.query });
});

/**
 * @description 통합모듈 결제 결과 처리
 */
const kspay_wh_result = catchAsync(async (req, res) => {
  const { reCommConId, ECHA } = req.body;
  const ipg = new KSPayWebHostBean({ payKey: reCommConId });
  const isSuccess = await ipg.send_msg(1);
  let result = false;
  let template_code = undefined;
  try {
    if (ECHA) {
      ipg.rvdata.referenceId = ECHA;
    }
  } catch (err) {}

  if (!isSuccess) {
    ipg.rvdata.authyn = "X";
    ipg.rvdata.msg1 = "취소";
  } else {
    //가상계좌 발급
    if (ipg.rvdata.result === "6001") {
      const res = await PayService.updateVbank(ipg.rvdata);
      if (res.code === "S") {
        template_code = TALK_TEMPLATE_TYPE.VIRTUAL_ACCOUNT;
        result = true;
      }
    }
    //카드결제 완료
    else {
      const res = await PayService.updateUpay(ipg.rvdata);
      if (res.code === "S") {
        template_code = TALK_TEMPLATE_TYPE.PAYMENT_SUCCESS;
        result = true;
      }
    }
  }

  //메시지 전송
  // if (result) {
  //   const res = await PayService.loadOrderDetail(ipg.rvdata.referenceId);
  //   if (res) {
  //     if (template_code) await sendMessage(res, template_code);
  //   }
  // }

  res.render("kspay_wh_result", {
    ...req.body,
    rvdata: ipg.rvdata,
  });
});

/**
 * @description Mypay Popup redirection 처리
 */
const mypay_rcv = catchAsync(async (req, res) => {
  console.log("#### mypay_rcv > req.body : ", req.body);
  res.render("mypay_rcv", { ...req.body, ...req.query });
});

/**
 * @description Mypay 결제 취소
 */
const mypay_cancel = catchAsync(async (req, res) => {
  console.log("#### mypay_cancel > req.body : ", req.body);
  res.render("mypay_cancel", { ...req.body, ...req.query });
});

/**
 * @description Mypay 결제 결과 처리
 */
const mypay_result = catchAsync(async (req, res) => {
  const { reCommConId, reRetParam } = req.body;

  const ipg = new MYPayWebHostBean({
    payKey: reCommConId,
  });
  const isSuccess = await ipg.send_msg(1);
  let result = false;
  let template_code = TALK_TEMPLATE_TYPE.PAYMENT_SUCCESS;
  try {
    ipg.rvdata.referenceId = reRetParam;
  } catch (err) {}

  if (!isSuccess) {
    ipg.rvdata.authyn = "X";
    ipg.rvdata.msg1 = "취소";
  } else {
    //카드결제 완료
    const res = await PayService.updateMypay(ipg.rvdata);
    if (res.code === "S") result = true;
  }

  //메시지 전송
  // if (result) {
  //   const res = await PayService.loadOrderDetail(ipg.rvdata.referenceId);
  //   if (res) await sendMessage(res, template_code);
  // }

  res.render("mypay_result", { ...req.body, ...req.query });
});

module.exports = {
  upay,
  easypay,
  kspay_wh_rcv,
  kspay_wh_result,
  mypay_rcv,
  mypay_cancel,
  mypay_result,
};
