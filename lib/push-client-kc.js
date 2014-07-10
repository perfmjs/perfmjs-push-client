/**
 * ssq push client
 * Created by Administrator on 2014/7/3.
 */
require('perfmjs-node');
require('./push-client');
perfmjs.plugin('kcPushClient', function($$) {
    $$.base("pushClient.kcPushClient", {
        init: function(initParam) {
            this._super('init');
            this.handleKCOpenData();
            return this;
        },
        handleKCOpenData: function() {
            var self = this;
            this.getRemoteData(function(responseText) {
                self._doBusness(responseText);
                var jsonData = $$.utils.fmtJSONMsg(responseText);
                if (jsonData.status === 'success') {
                    var leftTime = ($$.utils.toNumber(jsonData.result.leftTime) > 0)?$$.utils.toNumber(jsonData.result.leftTime):5;
                    var leftOpenTime = ($$.utils.toNumber(jsonData.result.leftOpenTime) > 0)?$$.utils.toNumber(jsonData.result.leftOpenTime):5;
                    var nextTime = (leftTime <= leftOpenTime)?leftTime:leftOpenTime;
                    if ($$.utils.toNumber(jsonData.result.nextTerm) - $$.utils.toNumber(jsonData.result.openTerm) > 1) {
                        nextTime = (nextTime <= 7)?nextTime:7;
                    }
                    $$.logger.info('下一次执行时间:' + nextTime + ' 秒后, 现在时间：' + new Date);
                    setTimeout(function() {
                        $$.logger.info("开始执行本次操作，时间:" + new Date);
                        self.handleKCOpenData();
                    }, nextTime * 1000);
                }
            });
        },
        _doBusness: function(responseText) {
            var self = this,jsonData = $$.utils.fmtJSONMsg(responseText);
            if (jsonData.status === 'success') {
                var unionId = jsonData.result.nextTerm + "-" + jsonData.result.openTerm + "-" + jsonData.result.result;
                this.option('redisPub').publish(this.getPubKey(), (function () {
                    $$.logger.info((new Date) + ", notifyAll:ssq-push-client#version=" + unionId);
                    return JSON.stringify(self.buildJSONData({'version':unionId,'dataType':'ssq','data':jsonData.result}));
                })());
            }
        },
        end: 0
    });
    $$.kcPushClient.defaults = {
        remoteUrl:'http://www.no100.com/lotnew/kc/kc.htm?gameIndex=313',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.kcPushClient;
    }
    /*for Node.js end*/
});