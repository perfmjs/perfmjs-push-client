/**
 * 应用入口函数
 * 后台启动 /usr/local/node/bin/forever start -a -l /tmp/push-client-forever.log -o ./logs/out.log -e logs/push-client-err.log start-notify-client.js; tail -f ./logs/push-client-out.log
 */
require("perfmjs-node");
var Shred = require("shred");
var shred = new Shred();
perfmjs.ready(function($$, app) {
    var buildJSONData = function(options) {
        return $$.utils.extend({'version':'0','dataType':'common','data':{},'changeType':'0','feature':{},'status':'success'}, options);
    };
    var intervalCall = function(interval, remoteUrl, callback) {
        setInterval(function() {
            $$.logger.info("starting get content from remote server....");
            var req = shred.get({
                url: remoteUrl,
                headers: { Accept: "application/json"}, timeout:{ minutes: 0, seconds: 4}, //time out in 1 minute and 30 seconds
                on: {
                    response: function(response) {
                        callback(response.content.body);
                    }, timeout: function(request) {
                        console.log( 'Ooops, request timed out! remoteUrl is; ' + remoteUrl);
                    }
                }
            });
        }, interval);
    };

    //开始执行业务调用方法
    intervalCall(5000,
        "http://www.no100.com/lotnew/kc/kc.htm?time=1404301111930&gameIndex=313",
        function(responseContent) {
            var jsonData =$$.utils.fmtJSONMsg(responseContent);
            if (jsonData.status === 'success') {
                var redisPub = require("redis").createClient(6379, 'ali.no100.com');
                redisPub.publish("/realtimeApp/jsbf", (function () {
                    var version = jsonData.result.stopTime;
                    $$.logger.info("notifyAll:jsbf-push-client#version=" + version);
                    return JSON.stringify(buildJSONData({'version': version, 'dataType': 'jsbf', 'data': jsonData.result}));
                })());
                redisPub.quit();
            }
        });
});