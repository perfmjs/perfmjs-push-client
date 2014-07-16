/**
 * Push Publish Client
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
        /**
         * 获取远程服务器数据,如果连接timeout则3秒后重新请求
         * @param remoteDataUrl
         * @param callback
         */
        getRemoteData: function(remoteDataUrl, callback) {
            var self = this;
            this.option('shred').get({
                url: remoteDataUrl,
                headers: {Accept: "application/json"}, timeout:{minutes: 0, seconds: 10}, //time out in 1 minute and 10 seconds
                on: {
                    response: function(response) {
                        callback(response.content.body);
                    }, timeout: function(request) {
                        $$.logger.info( '请求Timeout,3秒后重新请求, remoteDataUrl=' + self.option('remoteDataUrl'));
                        setTimeout(function() {
                            self.getRemoteData(remoteDataUrl, callback);
                        }, 3000);
                    }
                }
            });
        },
        _buildJSONData: function(options) {
            return $$.utils.extend({'version':'0','dataType':'common','data':{},'changeType':'0','feature':{},'status':'success'}, options);
        },
        /**
         * 获取发布Redis的key
         * @returns {string}
         */
        getPublishKey: function() {
            return this.option('redisChannelPrefix') + "publish/" + this.option('room');
        },
        /**
         * 每次客户端重新连接时接收初始数据(保存到redis里的最后一次成功推送的数据)
         * @param redis
         * @param jsonTextMsg
         * @private
         */
        _storeLastDataToRedis: function(redis, jsonTextMsg) {
            redis.set(this.option('redisChannelPrefix') + "lastData/" + this.option('room'), jsonTextMsg);
        },
        end: 0
    });
    $$.pushClient.defaults = {
        room: 'xxx',
        remoteDataUrl:'http://xxx.com/yyy',
        redisPort: 6379,
        redisHost: 'xxx.xxx.xxx.xxx',
        redisChannelPrefix: '/realtimeApp/',
        shred: {},
        redisPub: {},
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.pushClient;
    }
    /*for Node.js end*/
});