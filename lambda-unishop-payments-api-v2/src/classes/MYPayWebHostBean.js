const axios = require('axios');
let iconv = require('iconv-lite');
const config = require('../env');
const { buildUrl, getFullDate, get_etoken } = require('../utils');
const qs = require('querystring');

class MYPayWebHostBean {
  constructor(props) {
    this.KSPAY_WEBHOST_URL = config.mypay.apiUrl;
    this.DEFAULT_DELIM = '`';
    this.DEFAULT_RPARAMS = config.mypay.default_params;
    this.payKey = props.payKey ? props.payKey : '';
    this.rparams = this.DEFAULT_RPARAMS;
    this.mtype = config.mypay.mtype;
    this.rnames = null;
    this.rvdata = null;
    this.msalt = config.mypay.msalt;
    this.mhkey = config.mypay.mhkey;
    this.curr_date_14 = getFullDate();
    this.etoken = get_etoken(this.mhkey, this.curr_date_14, '');
    this.storeid = config.mypay.storeid;

    this.init();
  }

  init = () => {
    this.rnames = this.rparams.split(this.DEFAULT_DELIM);
    this.rvdata = undefined;
  };

  send_msg = async (_mtype) => {
    this.mtype = _mtype;

    await this.loadData();

    if (!this.rvdata) return false;

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
      sndEtoken: this.etoken,
      sndMsalt: this.msalt,
      sndStoreid: this.storeid,
      sndCharSet: 'utf-8',
    };
    let form = new URLSearchParams();
    form.append('sndCommConId', params.sndCommConId);
    form.append('sndActionType', params.sndActionType);
    form.append('sndRpyParams', params.sndRpyParams);
    form.append('sndEtoken', params.sndEtoken);
    form.append('sndMsalt', params.sndMsalt);
    form.append('sndStoreid', params.sndStoreid);
    form.append('sndCharSet', params.sndCharSet);

    const options = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const res = await axios.post(this.KSPAY_WEBHOST_URL, form, options);
    const { data } = res;

    if (res.status !== 200) return undefined;

    this.rvdata = data;
  };
}

module.exports = MYPayWebHostBean;
