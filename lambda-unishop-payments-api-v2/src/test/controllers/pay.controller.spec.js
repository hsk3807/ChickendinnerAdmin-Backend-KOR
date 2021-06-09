const expect = require('chai').expect;
const request = require('supertest');
const { TALK_TEMPLATE_TYPE } = require('../../utils/Constants');
var sha256 = require('js-sha256').sha256;
const { get_etoken, encrypt_msg, numberWithCommas } = require('../../utils');
const MYPayWebHostBean = require('../../classes/MYPayWebHostBean');
const PayService = require('../../services/pay.service');
const TalkService = require('../../services/talk.service');

const api = 'http://localhost:5000';

const curr_date_14 = '20210421054437';
const mhkey = '3F75BAFE7A742952997D3F5244B3B92F';
const mekey = 'F8ECDEF83483FF7A3ED45177BD55916C';
const servicetoken = 'sYs4Am9ap7rR4uC5W95R1q74j1FgDg';

const getOrderId = (order_id) => {
  try {
    let order_id_tmp = order_id.split('-');
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
  const { mobile, login_native_name, total_pv } = request_data.orderData;

  order_id = getOrderId(order_id);
  //가상 계좌 안내
  if (template_code === TALK_TEMPLATE_TYPE.VIRTUAL_ACCOUNT) {
    params = {
      dstaddr: mobile,
      variable: `${order_id}|${bank_name}|${bank_ref}|${login_native_name}|${numberWithCommas(
        backoffice_price
      )}|2021-04-16 00:00:00`,
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

// describe('결제 API Test', async () => {
//   it('request/vbank', async () => {
//     const ipg = {
//       rvdata: {
//         authyn: 'O',
//         trno: '677820016576',
//         trddt: '20210419',
//         trdtm: '110617',
//         amt: '6600',
//         authno: '04',
//         msg1: '계좌요청완료',
//         msg2: '',
//         ordno: 'carrot_1234',
//         isscd: '84959011544597',
//         aqucd: '',
//         result: '6001',
//         resultcd: '0000',
//         referenceId: 'UNISHOP-WEB-KR_10102',
//       },
//     };

//     const res = await PayService.updateVbank(ipg.rvdata);
//     expect(res.code).to.equal('S');
//   });

//   it('request/upay', async () => {
//     let result = false;
//     let template_code = undefined;

//     const ipg = {
//       rvdata: {
//         authyn: 'O',
//         trno: '177930071340',
//         trddt: '20210430',
//         trdtm: '134321',
//         amt: '46400',
//         authno: '00115008',
//         msg1: '현대개인일반카드',
//         msg2: 'OK: 00115008',
//         ordno: 'carrot_1234',
//         isscd: '08',
//         aqucd: '08',
//         result: '1001',
//         resultcd: '0000',
//         referenceId: 'UNISHOP-WEB-KR_10244',
//       },
//     };
//     const res = await PayService.updateUpay(ipg.rvdata);
//     if (res.code === 'S') {
//       template_code = TALK_TEMPLATE_TYPE.PAYMENT_SUCCESS;
//       result = true;
//     }
//     expect(res.code).to.equal('S');

//     // if (result) {
//     //   const res = await PayService.loadOrderDetail(ipg.rvdata.referenceId);
//     //   if (res) if (template_code) sendMessage(res, template_code);
//     // }
//   });

//   it('request/mypay', async () => {
//     const reCommConId = 'wv178f738aeac2150422';
//     const reHash = '1619055353533:AST:E2C6D1DB4D62EDD068A68956AC8BAC37';
//     const reCnclType = '0';
//     const reRetParam = 'UNISHOP-WEB-KR_10103';

//     const ipg = new MYPayWebHostBean({
//       payKey: reCommConId,
//     });
//     const isSuccess = await ipg.send_msg(1);
//     if (!isSuccess) {
//       ipg.rvdata.authyn = 'X';
//       ipg.rvdata.msg1 = '취소';
//     } else {
//       ipg.rvdata.referenceId = reRetParam;
//       const res = await PayService.updateMypay(ipg.rvdata);
//       expect(res.code).to.equal('S');
//     }
//   });
// });

describe('mypay', async () => {
  it('함수 체크 get_etoken', async () => {
    const etoken = get_etoken(mhkey, curr_date_14, '');
    // expect(etoken).to.equal(
    //   '20210421054437:24003f82683f455c9c56ae478df8309c2fcc2768b39dd67b3837c307cd1db750'
    // );
    const p_data = curr_date_14 + ':servicetoken=' + servicetoken;

    console.log('p_data : ', p_data);
    const edata = encrypt_msg(mekey, p_data);

    console.log('edata : ', edata);
  });

  // it('결과값 가지고 오기 API Test', async () => {
  //   const reCommConId = 'wv178f738aeac2150422';
  //   const reHash = '1619055353533:AST:E2C6D1DB4D62EDD068A68956AC8BAC37';
  //   const reCnclType = '0';
  //   const reRetParam = 'UNISHOP-WEB-KR_10103';

  //   const ipg = new MYPayWebHostBean({
  //     payKey: reCommConId,
  //   });
  //   const isSuccess = await ipg.send_msg(1);
  //   if (!isSuccess) {
  //     ipg.rvdata.authyn = 'X';
  //     ipg.rvdata.msg1 = '취소';
  //   }

  //   expect(ipg.rvdata.msg1).to.equal('테스트승인정상');
  // });
});
