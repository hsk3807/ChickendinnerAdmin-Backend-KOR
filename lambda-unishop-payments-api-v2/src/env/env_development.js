module.exports = {
  apiPath: 'https://aigo.portalsns.com/backend/crud',
  domain: 'https://ushop-kr.unicity.com/korea',
  unifoApiPath: 'https://member-kr.unicity.com/unifoapi/v1/KR',
  upay: {
    storeid: '2001104865',
    creditCardStoreId : '2001104865',
    virtualAccountStoreId : '2001106709',
  },
  mypay: {
    apiUrl: 'https://kspay.ksnet.to/store/MYPay/web_host/recv_jpost_tot.jsp',
    url: 'https://kspay.ksnet.to/store/MYPay/MYPayWebTot.jsp',
    default_params:
      'authyn`trno`trddt`trdtm`amt`acno`msg1`msg2`ordno`result`resultcd`bnkcd`storeid`username`email`goodname`mobile`cbauthyn`cbtrno`cbauthno`cbmsg1`cbmsg2`ksnet_svc_tkn`statuscd',
    storeid: '2001104957',
    mhkey: '3F75BAFE7A742952997D3F5244B3B92F',
    mekey: 'F8ECDEF83483FF7A3ED45177BD55916C',
    msalt: 'MA01',
    mpaymsalt: '01gs1mn48W',
    servicetoken: '',
    mtype: '1',
    storeno: 'KSNET00033',
  },
  alimtalk: {
    template_code: {
      SJT_055475: 'SJT_055475',
    },
  },
};

// module.exports = {
//   apiPath: 'https://aigo.portalsns.com/backend/crud',
//   domain: 'http://localhost:3000/korea',
//   unifoApiPath: 'https://member-kr.unicity.com/unifoapi/v1/KR',
//   upay: {
//     storeid: '2999199999',
//   },
//   mypay: {
//     apiUrl: 'http://210.181.28.134/store/MYPay/web_host/recv_jpost_tot.jsp',
//     url: 'https://210.181.28.134/store/MYPay/MYPayWebTot.jsp',
//     default_params:
//       'authyn`trno`trddt`trdtm`amt`acno`msg1`msg2`ordno`result`resultcd`bnkcd`storeid`username`email`goodname`mobile`cbauthyn`cbtrno`cbauthno`cbmsg1`cbmsg2`ksnet_svc_tkn`statuscd',
//     storeid: '2999199997',
//     mhkey: 'AE863EF774A6C55A1081D66B2B4CC967',
//     mekey: '4E89CED6F7F3BD8ECCACAAB97F034007',
//     msalt: 'SA08',
//     mpaymsalt: 'apUj1C9pSo',
//     servicetoken: '',
//     mtype: '1',
//     storeno: 'KSNET00005',
//   },

//   alimtalk: {
//     template_code: {
//       SJT_055475: 'SJT_055475',
//     },
//   },
// };
