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
    pushClient.intervalCall(5000,
        "http://www.no100.com/lotnew/kc/kc.htm?time=1404301111930&gameIndex=313",
        function(responseText) {
            $$.logger.info("startTime:" + new Date);
            var jsonData = $$.utils.fmtJSONMsg(responseText);
            if (jsonData.status === 'success') {
                var unionId = jsonData.result.nextTerm + "-" + jsonData.result.openTerm;
                var start = $$.utils.now();
                redisPub.get(pushClient.getVersionKey(), function(err, reply) {
                    if (err) {
                        $$.logger.error(err);
                        return false;
                    }
                    if ((!!reply == false) || reply != unionId) {
                        var version = unionId;
                        redisPub.set(pushClient.getVersionKey(), version);
                        redisPub.publish(pushClient.getPubKey(), (function () {
                            $$.logger.info("notifyAll:ssq-push-client#version=" + version);
                            $$.logger.info("endTime:" + new Date);
                            return JSON.stringify(pushClient.buildJSONData({'version': version,'dataType':'ssq','data':jsonData.result}));
                        })());
//                        redisPub.quit();
//                        redisPub.end();
                    }
                    //$$.logger.info("now2=" + ($$.utils.now() - start));
                });
            }
        });
});