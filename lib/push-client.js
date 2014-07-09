/**
 * 应用入口函数
 * 后台启动 /usr/local/node/bin/forever start -a -l /tmp/push-client-forever.log -o ./logs/out.log -e logs/push-client-err.log start-notify-client.js; tail -f ./logs/push-client-out.log
 */
require("perfmjs-node");
perfmjs.plugin('pushClient', function($$) {
    $$.base("pushClient", {
        init: function() {
            return this;
        },
        getData: function(remoteUrl, callback) {
            new this.options['shred']().get({
                url: remoteUrl,
                headers: {Accept: "application/json"}, timeout:{minutes: 0, seconds: 10}, //time out in 1 minute and 30 seconds
                on: {
                    response: function(response) {
                        callback(response.content.body);
                    }, timeout: function(request) {
                        console.log( 'Ooops, request timed out! remoteUrl is; ' + remoteUrl);
                    }
                }
            });
        },
        buildJSONData: function(options) {
            return $$.utils.extend({'version':'0','dataType':'common','data':{},'changeType':'0','feature':{},'status':'success'}, options);
        },
        getPubKey: function() {
            return this.option('redisPubKey');
        },
        getVersionKey: function() {
            return this.option('redisVersionKey');
        },
        end: 0
    });
    $$.pushClient.defaults = {
        scope: 'singleton',
        shred: require("shred"),
        redisPubKey: '/realtimeApp/ssq',
        redisVersionKey: '/realtimeApp/ssq/version',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.pushClient;
    }
    /*for Node.js end*/
});