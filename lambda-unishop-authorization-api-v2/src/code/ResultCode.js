const CommonCode = require('./CommonCode');

class ResultCode {

  constructor(props) {
    this.codeMsg = [];

    this.init();
  }

  init = () => {

    for(var k in CommonCode){
      this.codeMsg.push({codeKey: k, codeMsg : CommonCode[k]});
    }
  }

  getCodeMsg = (codeMsg = undefined) => {
    if(!codeMsg) return undefined;
    const findCodeMsg = this.codeMsg.find((cd) => cd.codeMsg === codeMsg);
    return {code : findCodeMsg.codeKey, message : findCodeMsg.codeMsg};
  }
}

module.exports = ResultCode;
