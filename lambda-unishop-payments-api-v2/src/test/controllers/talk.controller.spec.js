const expect = require('chai').expect;
const request = require('supertest');
const { TALK_TEMPLATE_TYPE } = require('../../utils/Constants');
const api = 'http://localhost:5000';

const isTest = true;
const dstaddr = '01085159491';

const sendMessage = async ({ dstaddr, variable, template_code }) => {
  let res = {};
  if (!isTest) res = { body: { isSuccess: true } };
  else {
    res = await request(api)
      .post('/talk/send')
      .send({
        dstaddr,
        variable,
        template_code,
      })
      .expect(200);
  }
  return res;
};

// describe('알리미 테스트', async () => {
//   it('[카카오톡 알림] 무통장 입금 안내', async () => {
//     const params = {
//       dstaddr,
//       variable: '주문번호|은행명|계좌번호|예금주명|입금금액|입금기한',
//       template_code: TALK_TEMPLATE_TYPE.VIRTUAL_ACCOUNT,
//     };
//     let res = await sendMessage(params);
//     expect(res.body.isSuccess).to.equal(true);
//   });

//   it('[카카오톡 알림] 간편 가입 안내', async () => {
//     const params = {
//       dstaddr,
//       variable: '보낸이|ID|memberType',
//       template_code: TALK_TEMPLATE_TYPE.ACCOUNT_LINK,
//     };
//     let res = await sendMessage(params);

//     expect(res.body.isSuccess).to.equal(true);
//   });

//   it('[카카오톡 알림] 결제 완료 안내', async () => {
//     const params = {
//       dstaddr,
//       variable: '15745082|독립후원자|2021-04-30|422490652|46,400|27',
//       template_code: TALK_TEMPLATE_TYPE.PAYMENT_SUCCESS,
//     };
//     let res = await sendMessage(params);
//     expect(res.body.isSuccess).to.equal(true);
//   });
// });
