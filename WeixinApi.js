(function (window) {

    "use strict";

    var WeixinApi = {version:3.3};
    window.WeixinApi = WeixinApi;

    if (typeof define === 'function' && (define.amd || define.cmd)) {
        if (define.amd) {
            define(function () {return WeixinApi;});
        } else if (define.cmd) {
            define(function (require, exports, module) {module.exports = WeixinApi;});
        }
    }

    var _extend = function () {
        var result = {}, obj, k;
        for (var i = 0, len = arguments.length; i < len; i++) {
            obj = arguments[i];
            if (typeof obj === 'object') {
                for (k in obj) {
                    result[k] = obj[k];
                }
            }
        }
        return result;
    };

    var _share = function (cmd, data, callbacks) {
        callbacks = callbacks || {};
        var progress = function (resp) {
            switch (true) {
                case /\:cancel$/i.test(resp.err_msg) :
                    callbacks.cancel && callbacks.cancel(resp);
                    break;
                case /\:(confirm|ok)$/i.test(resp.err_msg):
                    callbacks.confirm && callbacks.confirm(resp);
                    break;
                case /\:fail$/i.test(resp.err_msg) :
                default:
                    callbacks.fail && callbacks.fail(resp);
                    break;
            }
            callbacks.all && callbacks.all(resp);
        };

        var handler = function (theData, argv) {
            if (cmd.menu === 'menu:general:share') {
                if (argv.shareTo == 'favorite' || argv.scene == 'favorite') {
                    if (callbacks.favorite === false) {
                        return argv.generalShare(theData, function () {
                        });
                    }
                }
                argv.generalShare(theData, progress);
            } else {
                WeixinJSBridge.invoke(cmd.action, theData, progress);
            }
        };

        WeixinJSBridge.on(cmd.menu, function (argv) {
            if (callbacks.async && callbacks.ready) {
                WeixinApi["_wx_loadedCb_"] = callbacks.dataLoaded || new Function();
                if (WeixinApi["_wx_loadedCb_"].toString().indexOf("_wx_loadedCb_") > 0) {
                    WeixinApi["_wx_loadedCb_"] = new Function();
                }
                callbacks.dataLoaded = function (newData) {
                    var theData = _extend(data, newData);
                    if (cmd.menu == 'menu:share:timeline' ||
                        (cmd.menu == 'menu:general:share' && argv.shareTo == 'timeline')) {
                        theData = {
                            "appid":theData.appId ? theData.appId : '',
                            "img_url":theData.imgUrl,
                            "link":theData.link,
                            "desc":theData.title,
                            "title":theData.desc,
                            "img_width":"640",
                            "img_height":"640"
                        };
                    }
                    WeixinApi["_wx_loadedCb_"](theData);
                    handler(theData, argv);
                };
                if (!(argv && (argv.shareTo == 'favorite' || argv.scene == 'favorite') && callbacks.favorite === false)) {
                    callbacks.ready && callbacks.ready(argv, data);
                }
            } else {
                if (!(argv && (argv.shareTo == 'favorite' || argv.scene == 'favorite') && callbacks.favorite === false)) {
                    callbacks.ready && callbacks.ready(argv, data);
                }
                handler(data, argv);
            }
        });
    };

    WeixinApi.shareToTimeline = function (data, callbacks) {
        _share({
            menu:'menu:share:timeline',
            action:'shareTimeline'
        }, {
            "appid":data.appId ? data.appId : '',
            "img_url":data.imgUrl,
            "link":data.link,
            "desc":data.title,
            "title":data.desc,
            "img_width":"640",
            "img_height":"640"
        }, callbacks);
    };

    WeixinApi.shareToFriend = function (data, callbacks) {
        _share({
            menu:'menu:share:appmessage',
            action:'sendAppMessage'
        }, {
            "appid":data.appId ? data.appId : '',
            "img_url":data.imgUrl,
            "link":data.link,
            "desc":data.desc,
            "title":data.title,
            "img_width":"640",
            "img_height":"640"
        }, callbacks);
    };


    WeixinApi.shareToWeibo = function (data, callbacks) {
        _share({
            menu:'menu:share:weibo',
            action:'shareWeibo'
        }, {
            "content":data.desc,
            "url":data.link
        }, callbacks);
    };

    WeixinApi.generalShare = function (data, callbacks) {
        _share({
            menu:'menu:general:share'
        }, {
            "appid":data.appId ? data.appId : '',
            "img_url":data.imgUrl,
            "link":data.link,
            "desc":data.desc,
            "title":data.title,
            "img_width":"640",
            "img_height":"640"
        }, callbacks);
    };

    WeixinApi.addContact = function (appWeixinId, callbacks) {
        callbacks = callbacks || {};
        WeixinJSBridge.invoke("addContact", {
            webtype:"1",
            username:appWeixinId
        }, function (resp) {
            var success = !resp.err_msg || "add_contact:ok" == resp.err_msg
                || "add_contact:added" == resp.err_msg;
            if (success) {
                callbacks.success && callbacks.success(resp);
            } else {
                callbacks.fail && callbacks.fail(resp);
            }
        })
    };

    WeixinApi.imagePreview = function (curSrc, srcList) {
        if (!curSrc || !srcList || srcList.length == 0) {
            return;
        }
        WeixinJSBridge.invoke('imagePreview', {
            'current':curSrc,
            'urls':srcList
        });
    };

    WeixinApi.showOptionMenu = function () {
        WeixinJSBridge.call('showOptionMenu');
    };

    WeixinApi.hideOptionMenu = function () {
        WeixinJSBridge.call('hideOptionMenu');
    };

    WeixinApi.showToolbar = function () {
        WeixinJSBridge.call('showToolbar');
    };

    WeixinApi.hideToolbar = function () {
        WeixinJSBridge.call('hideToolbar');
    };

    WeixinApi.getNetworkType = function (callback) {
        if (callback && typeof callback == 'function') {
            WeixinJSBridge.invoke('getNetworkType', {}, function (e) {
                callback(e.err_msg);
            });
        }
    };

    WeixinApi.closeWindow = function (callbacks) {
        callbacks = callbacks || {};
        WeixinJSBridge.invoke("closeWindow", {}, function (resp) {
            switch (resp.err_msg) {
                case 'close_window:ok':
                    callbacks.success && callbacks.success(resp);
                    break;
                default :
                    callbacks.fail && callbacks.fail(resp);
                    break;
            }
        });
    };

    WeixinApi.ready = function (readyCallback) {
        if (readyCallback && typeof readyCallback == 'function') {
            var Api = this;
            var wxReadyFunc = function () {
                readyCallback(Api);
            };
            if (typeof window.WeixinJSBridge == "undefined") {
                if (document.addEventListener) {
                    document.addEventListener('WeixinJSBridgeReady', wxReadyFunc, false);
                } else if (document.attachEvent) {
                    document.attachEvent('WeixinJSBridgeReady', wxReadyFunc);
                    document.attachEvent('onWeixinJSBridgeReady', wxReadyFunc);
                }
            } else {
                wxReadyFunc();
            }
        }
    };

    WeixinApi.openInWeixin = function () {
        return /MicroMessenger/i.test(navigator.userAgent);
    };

    WeixinApi.scanQRCode = function (callbacks) {
        callbacks = callbacks || {};
        WeixinJSBridge.invoke("scanQRCode", {}, function (resp) {
            switch (resp.err_msg) {
                case 'scan_qrcode:ok':
                    callbacks.success && callbacks.success(resp);
                    break;
                default :
                    callbacks.fail && callbacks.fail(resp);
                    break;
            }
        });
    };

    WeixinApi.getInstallState = function (data, callbacks) {
        callbacks = callbacks || {};

        WeixinJSBridge.invoke("getInstallState", {
            "packageUrl":data.packageUrl || "",
            "packageName":data.packageName || ""
        }, function (resp) {
            var msg = resp.err_msg, match = msg.match(/state:yes_?(.*)$/);
            if (match) {
                resp.version = match[1] || "";
                callbacks.success && callbacks.success(resp);
            } else {
                callbacks.fail && callbacks.fail(resp);
            }

            callbacks.all && callbacks.all(resp);
        });
    };

    WeixinApi.openLocation = function (data, callbacks) {
        callbacks = callbacks || {};
        WeixinJSBridge.invoke('openLocation', {
            "latitude":data.latitude,
            "longitude":data.longitude,
            "name":data.name,
            "address":data.address,
            "scale":data.scale || 14,
            "infoUrl":data.infoUrl || ''
        }, function (resp) {
            if (resp.err_msg === "open_location:ok") {
                callbacks.success && callbacks.success(resp);
            } else {
                callbacks.fail && callbacks.fail(resp);
            }
            callbacks.all && callbacks.all(resp);
        });
    };

    WeixinApi.sendEmail = function (data, callbacks) {
        callbacks = callbacks || {};
        WeixinJSBridge.invoke("sendEmail", {
            "title":data.subject,
            "content":data.body
        }, function (resp) {
            if (resp.err_msg === 'send_email:sent') {
                callbacks.success && callbacks.success(resp);
            } else {
                callbacks.fail && callbacks.fail(resp);
            }
            callbacks.all && callbacks.all(resp);
        })
    };

    WeixinApi.enableDebugMode = function (callback) {
        window.onerror = function (errorMessage, scriptURI, lineNumber, columnNumber) {
            if (typeof callback === 'function') {
                callback({
                    message:errorMessage,
                    script:scriptURI,
                    line:lineNumber,
                    column:columnNumber
                });
            } else {
                var msgs = [];
                msgs.push("额，代码有错。。。");
                msgs.push("\n错误信息：", errorMessage);
                msgs.push("\n出错文件：", scriptURI);
                msgs.push("\n出错位置：", lineNumber + '行，' + columnNumber + '列');
                alert(msgs.join(''));
            }
        }
    };

})(window);
