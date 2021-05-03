var _KSPAY_DOMAIN = 'https://kspay.ksnet.to/'
var _KSPAY_URL = 'https://kspay.ksnet.to/store/KSPayWebV1.4/KSPayPWeb.jsp'
// var _KSPAY_URL = 'http://localhost:3000/checkout/response/test'
var _KSPAY_WIN_NAME = '_KSPAY_WIN'

var _kspay_pop_obj
var _kspay_pop_tx_key
var _kspay_pop_status = 0
var _kspay_pop_callback
var cnt = 0
var popupStatus = false

var _kspay_frm_target
var _kspay_frm_action
var _kspay_frm
var closeIframe

var submitI = function (formid, ifrmName, iWinX, iWinY) {
    if (formid.target != ifrmName) {
        if (document.getElementById('popup') == null) {
            //var installpop = "<iframe id=\"payment-frame\" name=\"payment-frame\" width=\"820\" height=\"70\" scrolling=\"no\" frameborder=\"0\" allowtransparency=\"true\"></iframe>";
            var installpop = ''
            installpop +=
                '<div id="overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background: #000;  opacity: 0.7; z-index: 9999;" ></div>'
            installpop +=
                '<div id="popup" style="position:absolute; top:50%; left:50%; width:' +
                iWinX +
                'px; height:' +
                iWinY +
                'px; border-radius:20px; margin-left:-' +
                parseInt(iWinX, 10) / 2 +
                'px;margin-top:-' +
                parseInt(iWinY, 10) / 2 +
                'px;  z-index: 10000; text-align: center; " >'
            //installpop += "<iframe id=\"payment-frame\" name=\"payment-frame\" src=\"\" width=" + iWinX + " height=" + iWinY + " scrolling=\"no\" frameborder=\"0\" allowtransparency=\"true\" style=\"background: #FFFFFF; border-radius:20px;\"  ></iframe>";
            installpop += '</div>'

            var attachElement = document.body
            var newDiv
            newDiv = document.createElement('span')
            newDiv.innerHTML = installpop
            attachElement.appendChild(newDiv)
        }
    }
    $('#popup').html(
        '<iframe id="payment-frame" name="payment-frame" src="" width="' +
            iWinX +
            '" height="' +
            iWinY +
            '" scrolling="no" frameborder="0" allowtransparency="true" style="background: #FFFFFF; border-radius:20px;"></iframe>'
    )
    $('#overlay, #popup').show()

    formid.method = 'get'
    formid.target = 'payment-frame'
    var _call_url = _KSPAY_URL
    _call_url = _call_url
    formid.action = _call_url
    formid.submit()
}
function isMobile() {
    var filter = 'win16|win32|win64|mac|macintel'

    if (navigator.platform) {
        if (filter.indexOf(navigator.platform.toLowerCase()) < 0) {
            return true
        } else {
            return false
        }
    }
}
function _pay(_frm) {
    if (isMobile()) {
        alert(
            'PC\uD658\uACBD\uC5D0\uC11C\uB9CC \uC9C0\uC6D0\uB429\uB2C8\uB2E4.'
        )
        return
    }
    if (
        'undefined' != typeof _frm.sndMinAmount &&
        null != _frm.sndMinAmount.value
    ) {
        if (
            parseInt(_frm.sndMinAmount.value, 10) >
            parseInt(_frm.sndAmount.value, 10)
        ) {
            alert(
                _frm.sndMinAmount.value +
                    '\uC6D0 \uC774\uC0C1\uC758 \uAE08\uC561\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4.'
            )
            return
        }
    }
    if (
        'undefined' != typeof _frm.sndMaxAmount &&
        null != _frm.sndMaxAmount.value
    ) {
        if (
            parseInt(_frm.sndMaxAmount.value, 10) <
            parseInt(_frm.sndAmount.value, 10)
        ) {
            alert(
                _frm.sndMaxAmount.value +
                    '\uC6D0 \uC774\uD558\uC758 \uAE08\uC561\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4.'
            )
            return
        }
    }
    if (
        _frm.sndStoreid.value == '2999199996' &&
        (parseInt(_frm.sndAmount.value, 10) < 1000 ||
            parseInt(_frm.sndAmount.value, 10) > 1000000)
    ) {
        alert(
            '1000\uC6D0 \uC774\uC0C1 1000000\uC6D0 \uC774\uD558\uC758 \uAE08\uC561\uB9CC \uAC00\uB2A5\uD569\uB2C8\uB2E4.'
        )
        return
    }
    if ('_KSPAY_WIN' != _frm.target) {
        _kspay_frm_target = _frm.target
        _kspay_frm_action = _frm.action
        _kspay_frm = _frm
    }

    var u_agent = navigator.userAgent
    var trident = u_agent.match(/Trident\/(\d.\d)/i)

    if (trident != null) {
        if (trident[1] == '5.0' || trident[1] == '6.0' || trident[1] == '7.0') {
            iWinX = '820'
            iWinY = '630'
        } else {
            iWinX = '822'
            iWinY = '610'
        }
    } else {
        iWinX = '822'
        iWinY = '630'
    }

    if (
        'undefined' != typeof _frm.iframeYn &&
        null != _frm.iframeYn.value &&
        _frm.iframeYn.value == 'N'
    ) {
        popupFlag = true
    } else {
        popupFlag = false
    }
    if (!popupFlag) {
        submitI(_frm, _KSPAY_WIN_NAME, iWinX, iWinY)
    } else {
        _kspay_pop_tx_key = 'KSPAY' + new Date().getTime() //여러 번 호출될 수 있으니 인증값 수신여부 체크를 위한 키를 생성한다.
        if (_frm.target != _KSPAY_WIN_NAME) {
            var installpop = ''
            installpop +=
                '<div id="' +
                _KSPAY_WIN_NAME +
                '_div" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:20000000000000000000000000;">'
            installpop +=
                '<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:#000; opacity:.5; filter:alpha(opacity=50); line-height:450px;"></div>'
            installpop += '</div>'

            var attachElement = document.body
            var newDiv
            newDiv = document.createElement('div')
            newDiv.setAttribute('id', _KSPAY_WIN_NAME)
            newDiv.innerHTML = installpop
            attachElement.appendChild(newDiv)
        }
        closeIframe = function () {
            var element = document.getElementById(_KSPAY_WIN_NAME)
            element.parentNode.removeChild(element)
        }
        var left_ = screen.width
        var top_ = screen.height

        left_ = left_ / 2 - iWinX / 2
        top_ = top_ / 2 - iWinY / 2

        _kspay_pop_obj = window.open(
            'about:blank',
            _KSPAY_WIN_NAME,
            'height=' +
                iWinY +
                ',width=' +
                iWinX +
                ',dependent=yes, status=no, minimizable=no, fullscreen=no, location=no, scrollbars=no, menubar=no, toolbar=no, titlebar=no, directories=no, resizable=no,left=' +
                left_ +
                ',top=' +
                top_ +
                ''
        )

        if (_kspay_pop_obj == null) {
            if (_KSPAY_WIN_NAME == _frm.target) {
                _frm.target = _kspay_frm_target
                _frm.action = _kspay_frm_action
                _kspay_frm = null
            }

            alert(
                '\uD31D\uC5C5\uC774 \uCC28\uB2E8\uB418\uC5B4 \uACB0\uC81C\uB97C \uC9C4\uD589\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uD31D\uC5C5\uCC28\uB2E8\uC744 \uD574\uC81C\uD574\uC8FC\uC138\uC694.'
            ) //팝업이 차단되어 결제를 진행하지 못했습니다. 팝업차단을 해제해주세요.

            return false
        }

        var _call_url = _KSPAY_URL

        _kspay_pop_callback = ''
        _kspay_pop_status = 0
        popupStatus = true
        _KSP_CHECK_CHILD()
        _frm.target = _KSPAY_WIN_NAME
        _frm.action = _call_url

        _frm.submit()
    }
}
function closePayment() {
    try {
        $('#overlay,#popup').hide()
        $('#payment-frame').remove()
    } catch (e) {}
}
function closeEvent() {
    try {
        if (popupFlag) {
            closeIframe()
        } else {
            closePayment()
        }
    } catch (e) {}
}
function sleep(milliseconds) {
    var start = new Date().getTime()

    for (var i = 0; i < 1e7; i++) {
        if (new Date().getTime() - start > milliseconds) {
            break
        }
    }
}
function closeFormEvent() {
    try {
        sleep(1000)
        mcancel()
    } catch (e) {
        closeEvent()
    }
}
//popup
function _KSP_CHECK_CHILD() {
    if (1 == _kspay_pop_status) return

    var is_open = true
    var use_polling =
        'unknown' != typeof window.localStorage &&
        'undefined' != typeof window.localStorage

    try {
        if (
            null == _kspay_pop_obj ||
            ('undefined' != typeof _kspay_pop_obj.closed &&
                _kspay_pop_obj.closed)
        )
            is_open = false
    } catch (ex) {}

    if (use_polling && null != _kspay_pop_tx_key) {
        var robj = localStorage.getItem('kspay_' + _kspay_pop_tx_key)
        cnt++
        if (null != robj) {
            localStorage.removeItem('kspay_' + _kspay_pop_tx_key)
            _kspay_pop_status = 1

            if (_kspay_pop_callback) {
                _kspay_pop_callback(robj)
            }
            return
        }
    }
    if (cnt < 300) {
        if (!is_open) {
            localStorage.removeItem('kspay_' + _kspay_pop_tx_key)
            if (popupStatus) {
                if (_KSPAY_WIN_NAME == _kspay_frm.target) {
                    _kspay_frm.target = _kspay_frm_target
                    _kspay_frm.action = _kspay_frm_action
                    _kspay_frm = null
                }
                closeFormEvent()
            }
            return
        } else {
            setTimeout('_KSP_CHECK_CHILD()', 1000)
        }
    }
}

const paySuccess = () => {
    $('#overlay, #popup').hide()

    setTimeout(() => {
        window.location.href = '/checkout/payment-response/success'
    }, 300)
}

const payFailed = () => {
    $('#overlay, #popup').hide()

    setTimeout(() => {
        window.location.href = '/checkout/payment-response/failed'
    }, 300)
}

global._pay = _pay
global.paySuccess = paySuccess
global.payFailed = payFailed
