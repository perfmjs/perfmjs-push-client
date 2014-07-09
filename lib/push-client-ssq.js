/**
 * ssq push client
 * Created by Administrator on 2014/7/3.
 */
require("perfmjs-node");
perfmjs.ready(function($$, app) {
    app.register('pushClient', require("./push-client"));
    app.start('pushClient');

    //开始执行业务调用方法
    var pushClient = $$.pushClient.instance;
    var redisPub = require("redis").createClient(6379, 'ali.no100.com');

    var doBusness =  function(responseText) {
        var jsonData = $$.utils.fmtJSONMsg(responseText);
        if (jsonData.status === 'success') {
            var unionId = jsonData.result.nextTerm + "-" + jsonData.result.openTerm;
            redisPub.publish(pushClient.getPubKey(), (function () {
                $$.logger.info((new Date) + ", notifyAll:ssq-push-client#version=" + unionId);
                return JSON.stringify(pushClient.buildJSONData({'version':unionId,'dataType':'ssq','data':jsonData.result}));
            })());
        }
    };
    var handleKCOpenData = function() {
        pushClient.getData("http://www.no100.com/lotnew/kc/kc.htm?gameIndex=313&time=" + $$.utils.now(),  function(responseText) {
            doBusness(responseText);
            var self = this, jsonData = $$.utils.fmtJSONMsg(responseText);
            if (jsonData.status === 'success') {
                var leftTime = ($$.utils.toNumber(jsonData.result.leftTime) > 0)?$$.utils.toNumber(jsonData.result.leftTime):5;
                var leftOpenTime = ($$.utils.toNumber(jsonData.result.leftOpenTime) > 0)?$$.utils.toNumber(jsonData.result.leftOpenTime):5;
                nextTime = (leftTime <= leftOpenTime)?leftTime:leftOpenTime;
                $$.logger.info('下一次执行时间:' + nextTime + ' secs' + "/" + new Date);
                setTimeout(function() {
                    console.log("执行本次操作，时间:" + new Date);
                    handleKCOpenData();
                }, nextTime * 1000);
            }
        });
    };
    handleKCOpenData();
});