const axios = require('axios');
let iconv = require('iconv-lite');
const { buildUrl } = require('../utils');

class KSPayWebHostBean {
  constructor(props) {
    this.KSPAY_WEBHOST_URL =
      'http://kspay.ksnet.to/store/KSPayMobileV1.4/web_host/recv_post.jsp';
    this.DEFAULT_DELIM = '`';
    this.DEFAULT_RPARAMS =
      'authyn`trno`trddt`trdtm`amt`authno`msg1`msg2`ordno`isscd`aqucd`result';

    this.payKey = props.payKey ? props.payKey : '';
    this.rparams = this.DEFAULT_RPARAMS;
    this.mtype = '';
    this.rnames = null;
    this.rvdata = null;

    this.init();
  }

  init = () => {
    this.rnames = this.rparams.split(this.DEFAULT_DELIM);
    this.rvdata = {};
  };

  send_msg = async (_mtype) => {
    this.mtype = _mtype;

    const rmsg = await this.loadData();

    if (rmsg.indexOf('`') == -1) return false;

    const tmpvals = rmsg.split(this.DEFAULT_DELIM);

    if (this.rnames.length > tmpvals.length) return false;

    for (var i = 0; i < this.rnames.length; i++) {
      const key = this.rnames[i];
      const value = tmpvals[i + 1].toString().trim();
      this.rvdata[key] = value;
    }

    try {
      if (this.rvdata.authyn != null && this.rvdata.authyn.length === 1) {
        if (this.rvdata.authyn.indexOf('O') !== -1)
          this.rvdata.resultcd = '0000';
        else this.rvdata.resultcd = this.rvdata.authno.toString().trim();
      }
    } catch (err) {}

    return true;
  };

  loadData = async () => {
    const params = {
      sndCommConId: this.payKey,
      sndActionType: this.mtype,
      sndRpyParams: this.DEFAULT_RPARAMS,
    };
    const url = await buildUrl(this.KSPAY_WEBHOST_URL, params);

    const res = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    const { data } = res;

    const contents = iconv.decode(data, 'EUC-KR').toString();
    return contents;
  };
}

module.exports = KSPayWebHostBean;
