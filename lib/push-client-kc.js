/**
 * 快乐扑克3 Push Publish Client
 * Created by Administrator on 2014/7/3.
 */
require('perfmjs-node');
require('./push-client');
perfmjs.plugin('kcPushClient', function($$) {
    $$.base("pushClient.kcPushClient", {
        init: function(initParam) {
            this.option('shred',  new (require("shred"))());
            this.option('redisPub', $$.redisCluster.instance.initStartupOptions(this.option('redisClusterNodes')));
            this._handleOpenData();
            return this;
        },
        /**
         * 处理dataChange发送过来的redis消息，用于开奖信息实时推送
         * 注意：该方法只允许一个实例对象执行，不然会重复推送开奖信息
         * @param dataChangeGameJSON, e.g. {'303':$$.dj11yPushClient.instance,'316':$$.gxk3PushClient.instance,'314':$$.klpkPushClient.instance}
         * @private
         */
        _handleDataChangeNotify: function(dataChangeGameJSON) {
            var self = this;
            if (!dataChangeGameJSON) {
                $$.logger.info("请先指定合法的dataChangeGameJSON参数再启动监听dataChange处理函数!");
                return;
            }
            dataChangeGameJSON = dataChangeGameJSON || {};
            dataChangeGameJSONKeys = $$.utils.keys(dataChangeGameJSON);
            this.option('redisPub').subscribe(this.getDataChangeNotifyKey(), function(err, reply, redis) {
                if (err) {
                    $$.logger.error('error Occurred at redis subscribe: ' + err.message);
                    return;
                }
                $$.logger.info(self.option('room') + "正在监听来自dataChange的消息,gameIds:" + dataChangeGameJSONKeys.join(','));
                if (dataChangeGameJSONKeys.length < 1) {
                    return;
                }
                redis.on("message", function (channel, message) {
                    $$.utils.forEach(dataChangeGameJSONKeys, function(item, index) {
                        if ($$.utils.toNumber(message) === $$.utils.toNumber(item)) {
                            $$.logger.info('channel' + ':' + channel + '=====接收到数据:' + message);
                            dataChangeGameJSON[item] && dataChangeGameJSON[item]._handleOpenData();
                        }
                    });
                });
            });
        },
        _handleOpenData: function() {
            var self = this;
            this.getRemoteData(this.option('remoteDataUrl') + '&time=' + $$.utils.now(), function(responseText) {
                var jsonData = $$.utils.fmtJSONMsg(responseText);
                self._doBusness(jsonData);
                if (jsonData.status === 'success') {
                    var leftTime = $$.utils.toNumber(jsonData.result.leftTime);
                    //当leftTime为负数时，10秒推一次数据
                    leftTime = (leftTime > 0) ? leftTime : (leftTime < 0 ? 10 : 1);
                    var leftOpenTime = ($$.utils.toNumber(jsonData.result.leftOpenTime) > 0) ? $$.utils.toNumber(jsonData.result.leftOpenTime) : 1;
                    var nextTime = (leftTime <= leftOpenTime) ? leftTime : leftOpenTime;
                    //leftTime >= 3600也即意味着彩期切换到了第2天的第1期
                    //增加数据推送条件：在第2天第1期彩期切换后到今天最后一期开奖结果出来前
                    if ((nextTime > 1 && nextTime < 3600) || (self._isFirstTerm(jsonData.result.nextTerm) && !self._isLastTerm(jsonData.result.openTerm))) {
                        //当前销售期比最近开奖期数>1的情况处理
                        if ($$.utils.toNumber(jsonData.result.nextTerm) - $$.utils.toNumber(jsonData.result.openTerm) > 1) {
                            var lastOpenTime = $$.utils.toNumber(self.option('nextOpenTermAndTime')['leftOpenTime']);
                            $$.logger.info(self.option('room') + "==lastOpenTime=" + lastOpenTime + "/nextOpenTerm=" + self.option('nextOpenTermAndTime')['nextOpenTerm'] + "/nextTime=" + nextTime);
                            if (lastOpenTime > 0 && ($$.utils.toNumber(self.option('nextOpenTermAndTime')['nextOpenTerm']) - $$.utils.toNumber(jsonData.result.openTerm) == 1)) {
                                if (lastOpenTime <=  nextTime) {
                                    nextTime = lastOpenTime;
                                }
                                self.option('nextOpenTermAndTime', {nextOpenTerm: '0', leftOpenTime: 0});
                            } else {
                                //7秒刷一次开奖信息
                                nextTime = (nextTime <= 7) ? nextTime : 7;
                            }
                        } else if ($$.utils.toNumber(jsonData.result.nextTerm) - $$.utils.toNumber(jsonData.result.openTerm) == 1) {
                            self.option('nextOpenTermAndTime', {nextOpenTerm: jsonData.result.nextTerm, leftOpenTime: $$.utils.toNumber(jsonData.result.leftOpenTime) - nextTime});
                            $$.logger.info("*****lastOpenTime=" + self.option('nextOpenTermAndTime')['leftOpenTime'] + "/nextOpenTerm=" + self.option('nextOpenTermAndTime')['nextOpenTerm']);
                        }
                    }
                    //将结果存到redis中
                    self._storeLastDataToRedis(nextTime, jsonData);
                    //先清空已有timeout变量，然后setTimeout
                    $$.logger.info(self.option('room') + '下一次执行时间:' + nextTime + ' 秒后');
                    if ($$.utils.toBoolean(self.option('kcHandleOpenDataTimer'))) {
                        clearTimeout(self.option('kcHandleOpenDataTimer'));
                        self.option('kcHandleOpenDataTimer', null);
                    }
                    self.option('kcHandleOpenDataTimer', setTimeout(function() {
                        $$.logger.info(self.option('room') + ', setTimeout后，开始执行本次操作');
                        self._handleOpenData();
                        $$.logger.info(self.option('room') + ', setTimeout后，开始执行本次操作2');
                    }, nextTime * 1000));
                }
            });
        },
        /**
         * 指定彩期是否为第1期
         * @param specialTerm
         * @private
         */
        _isFirstTerm: function(specialTerm) {
            specialTerm = specialTerm || '';
            return $$.utils.toNumber(specialTerm.substring(specialTerm.length - 2)) === 1;
        },
        /**
         * 指定彩期是否为最后那一期
         * @param currentTerm
         * @private
         */
        _isLastTerm: function(specialTerm) {
            specialTerm = specialTerm || '';
            return $$.utils.toNumber(specialTerm.substring(specialTerm.length - 2)) === this.option('totalTermNum');
        },
        /**
         * 发送业务数据到浏览器端
         * @param jsonData 格式化后的json数据
         * @private
         */
        _doBusness: function(jsonData) {
            var self = this;
            if (jsonData.status === 'success') {
                var unionId = jsonData.result.nextTerm + "-" + jsonData.result.openTerm + "-" + jsonData.result.result;
                this.option('redisPub').publish(this.getPublishKey(), (function () {
                    $$.logger.info(self.getPublishKey() + ',notifyAll:push-client(' + self.option('room') + ')#version=' + unionId);
                    return JSON.stringify(self._buildJSONData({'version':unionId,'dataType':self.option('room'),'data':jsonData.result}));
                })(), function(err, reply, redisClient) {
                    if (err) {
                        $$.logger.info('error occured on publish command, the key is:' + self.getPublishKey() + ", err:" + err);
                        return;
                    }
                });
            }
        },
        end: 0
    });
    $$.kcPushClient.defaults = {
        room: 'xxx',
        totalTermNum: 0,
        remoteDataUrl:'xxx',
        nextOpenTermAndTime: {nextOpenTerm:'0', leftOpenTime:0},
        redisClusterNodes: $$.sysConfig.config.get('redis.clusterNodes'),
        redisChannelPrefix:'/realtimeApp/',
        kcHandleOpenDataTimer: null,
        shred: null,
        redisPub: null,
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.kcPushClient;
    }
    /*for Node.js end*/
});