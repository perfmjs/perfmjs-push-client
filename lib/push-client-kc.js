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
            this._getDataChangeNotify();
            return this;
        },
        _getDataChangeNotify: function() {
            var self = this;
            this.option('redisPub').subscribe(this.getDataChangeNotifyKey(), function(err, reply, redis) {
                if (err) {
                    $$.logger.error('error Occurred at redis subscribe: ' + err.message);
                    return;
                }
                console.log("正在监听来自dataChange的消息,gameId:" + self.option('gameId'));
                redis.on("message", function (channel, message) {
                    console.log( 'channel' + '/' + channel + '=====接收到数据' + message);
                    if ($$.utils.toNumber(message) === self.option('gameId')) {
                        self._handleOpenData();
                    }
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
                    $$.logger.info(self.option('room') + '下一次执行时间:' + nextTime + ' 秒后');
                    setTimeout(function() {
                        //$$.logger.info("开始执行本次操作，时间:" + new Date);
                        self._handleOpenData();
                    }, nextTime * 1000);
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
        room: 'klpk',
        gameId: -1,
        totalTermNum: 79,
        remoteDataUrl:'http://sina.aicai.com/lotnew/kc/kc.htm?time=1405581063067&gameIndex=314',
        nextOpenTermAndTime: {nextOpenTerm:'0', leftOpenTime:0},
        redisClusterNodes: [{host:'192.168.66.47',port:7000}, {host:'192.168.66.47',port:7001}, {host:'192.168.66.47',port:7002}],
        redisChannelPrefix:'/realtimeApp/',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.kcPushClient;
    }
    /*for Node.js end*/
});