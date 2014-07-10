/**
 * 应用入口函数
 * 后台启动 /usr/local/node/bin/forever start -a -l /tmp/push-client-forever.log -o ./logs/out.log -e logs/push-client-err.log start-notify-client.js; tail -f ./logs/push-client-out.log
 */
require("perfmjs-node");
perfmjs.plugin('pushClient', function($$) {
    $$.base("pushClient", {
        init: function(initParam) {
            this.option('shred',  new (require("shred"))());
            this.option('redisPub', require("redis").createClient(this.option('redisPort'), this.option('redisHost')));
            return this;
        },
        getRemoteData: function(callback) {
            var self = this;
            this.option('shred').get({
                url: self.option('remoteUrl') + '&time=' + $$.utils.now(),
                headers: {Accept: "application/json"}, timeout:{minutes: 0, seconds: 10}, //time out in 1 minute and 10 seconds
                on: {
                    response: function(response) {
                        callback(response.content.body);
                    }, timeout: function(request) {
                        $$.logger.info( '请求Timeout,3秒后重新请求, remoteUrl=' + self.option('remoteUrl'));
                        setTimeout(function() {
                            self.getRemoteData(callback);
                        }, 3000);
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
        end: 0
    });
    $$.pushClient.defaults = {
        redisPub: {},
        redisPort: 6379,
        redisHost: 'ali.no100.com',
        shred: {},
        remoteUrl:'http://xxx.com/yyy',
        redisPubKey: '/realtimeApp/ssq',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.pushClient;
    }
    /*for Node.js end*/
});