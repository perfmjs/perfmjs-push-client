/**
 * Push Publish Client
 * 后台启动 /usr/local/node/bin/forever start -a -l /tmp/push-client-forever.log -o ./logs/out.log -e logs/push-client-err.log start-notify-client.js; tail -f ./logs/push-client-out.log
 */
require("perfmjs-node");
perfmjs.plugin('pushClient', function($$) {
    $$.base("pushClient", {
        init: function(initParam) {
            this.option('shred',  new (require("shred"))());
            this.option('redisPub', $$.redisCluster.instance.initStartupOptions(this.option('redisClusterNodes')));
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
                headers: {Accept: "application/json"}, timeout:{minutes: 0, seconds: 20}, //time out in 1 minute and 10 seconds
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
        /**
         * 每次客户端重新连接时接收初始数据(保存到redis里的最后一次成功推送的数据)
         * @param nextTime 过期时间
         * @param jsonData 从httpclient获取并格式化后的jsonData
         * @private
         */
        _storeLastDataToRedis: function(nextTime, jsonData) {
            var expireTime = 1, leftTime = $$.utils.toNumber(jsonData.result.leftTime);
            if (jsonData.status === 'success' && $$.utils.toNumber(nextTime) > 0) {
                expireTime = $$.utils.now() + ($$.utils.toNumber(leftTime) * 1000);
                var unionId = jsonData.result.nextTerm + "-" + jsonData.result.openTerm + "-" + jsonData.result.result;
                var jsonText = JSON.stringify(this._buildJSONData({'version':unionId,'dataType':this.option('room'),'data':jsonData.result,'feature':{'expireTime':expireTime}}));
                this.option('redisPub').setex(this.getStoredLastDataKey(), nextTime, jsonText);
            }
        },
        /**
         * 获取发布Redis的key
         * @returns {string}
         */
        getPublishKey: function() {
            return this.option('redisChannelPrefix') + "publish/" + this.option('room');
        },
        /**
         * 获取存储的最终数据的Key
         * @returns {string}
         */
        getStoredLastDataKey: function() {
            return this.option('redisChannelPrefix') + "latestData/" + this.option('room');
        },
        /**
         *获取来自datachange系统的推送key
         * @returns {string}
         */
        getDataChangeNotifyKey: function() {
            return this.option('redisChannelPrefix') + "dataChange/kc";
        },
        _buildJSONData: function(options) {
            return $$.utils.extend({'version':'0','dataType':'common','data':{},'changeType':'0','feature':{},'status':'success'}, options);
        },
        end: 0
    });
    $$.pushClient.defaults = {
        room: 'xxx',
        remoteDataUrl:'http://xxx.com/yyy',
        redisClusterNodes:[{host:'*.*.*.*',port:7000}, {host:'*.*.*.*',port:7001}, {host:'*.*.*.*',port:7002}],
        redisChannelPrefix:'/realtimeApp/',
        shred: null,
        redisPub: null,
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.pushClient;
    }
    /*for Node.js end*/
});