/**
 * Push Publish Client
 * 后台启动 /usr/local/node/bin/forever start -a -l /tmp/push-client-forever.log -o ./logs/out.log -e logs/push-client-err.log start-notify-client.js; tail -f ./logs/push-client-out.log
 */
require("perfmjs-node");
perfmjs.plugin('pushClient', function($$) {
    $$.base("pushClient", {
        init: function(initParam) {
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
            try {
                require('request').get({'url':remoteDataUrl, 'json':true}, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback(body);
                    } else {
                        $$.logger.info( '请求出错,3秒后重新请求, remoteDataUrl=' + remoteDataUrl);
                        setTimeout(function() {
                            self.getRemoteData(remoteDataUrl, callback);
                        }, 3000);
                    }
                });
            } catch (err) {
                $$.logger.error('error on getRemoteData: ' + err.stack||err.message);
            }
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
         * 保存到redis里最后一次成功获取的预开奖信息
         * @param openSecondResult 来自dataChange的预开奖号码
         * @private
         */
        _storeOpenSecondResultToRedis: function(openSecondResult) {
            this.option('redisPub').set(this.getDataChangeKcSecondResultKey(), openSecondResult, function(err, reply, redisClient) {
                if (err) {
                    $$.logger.error('_storeOpenSecondResultToRedis#error:' + err.stack||err.message);
                    return;
                }
            });
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
        /**
         * 快彩获取来自datachange系统的推送预开奖号码Key
         */
        getDataChangeKcSecondResultKey: function() {
            return this.option('redisChannelPrefix') + "dataChange/kc/openSecondResult/" + this.option('room');
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
        redisPub: null,
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.pushClient;
    }
    /*for Node.js end*/
});