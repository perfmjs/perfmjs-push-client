/**
 * 幸运赛车Push Publish Client
 * Created by Administrator on 2014/7/3.
 */
require('perfmjs-node');
require('./push-client');
perfmjs.plugin('xyscPushClient', function($$) {
    $$.base("pushClient.xyscPushClient", {
        init: function(initParam) {
            this._super('init', initParam);
            this.handleKCOpenData();
            return this;
        },
        handleKCOpenData: function() {
            var self = this;
            this.getRemoteData(this.option('remoteDataUrl') + '&time=' + $$.utils.now(), function(responseText) {
                self._doBusness(responseText);
                var jsonData = $$.utils.fmtJSONMsg(responseText);
                if (jsonData.status === 'success') {
                    var leftTime = ($$.utils.toNumber(jsonData.result.leftTime) > 0)?$$.utils.toNumber(jsonData.result.leftTime) : 3;
                    var leftOpenTime = ($$.utils.toNumber(jsonData.result.leftOpenTime) > 0) ? $$.utils.toNumber(jsonData.result.leftOpenTime) : 3;
                    var nextTime = (leftTime <= leftOpenTime) ? leftTime : leftOpenTime;
                    //leftTime >= 3600 means that the currentTerm is next day's first term
                    if (nextTime > 3 && nextTime < 3600) {
                        //当前销售期比最近开奖期数>1的情况处理
                        if ($$.utils.toNumber(jsonData.result.nextTerm) - $$.utils.toNumber(jsonData.result.openTerm) > 1) {
                            var lastOpenTime = $$.utils.toNumber(self.option('nextOpenTermAndTime')['leftOpenTime']);
                            if (lastOpenTime > 0 && ($$.utils.toNumber(self.option('nextOpenTermAndTime')['nextOpenTerm']) - $$.utils.toNumber(jsonData.result.openTerm) === 1)) {
                                if (lastOpenTime <=  nextTime) {
                                    nextTime = lastOpenTime;
                                    self.option('nextOpenTermAndTime', {nextOpenTerm: '0', leftOpenTime: 0});
                                }
                            } else {
                                //7秒刷一次开奖信息
                                nextTime = (nextTime <= 7) ? nextTime : 7;
                            }
                        } else if ($$.utils.toNumber(jsonData.result.nextTerm) - $$.utils.toNumber(jsonData.result.openTerm) === 1) {
                            self.option('nextOpenTermAndTime')['nextOpenTerm'] = jsonData.result.nextTerm;
                            self.option('nextOpenTermAndTime')['leftOpenTime'] = jsonData.result.leftOpenTime;
                        }
                    }
                    //$$.logger.info('下一次执行时间:' + nextTime + ' 秒后, 现在时间：' + new Date);
                    setTimeout(function() {
                        //$$.logger.info("开始执行本次操作，时间:" + new Date);
                        self.handleKCOpenData();
                    }, nextTime * 1000);
                }
            });
        },
        _doBusness: function(responseText) {
            var self = this,jsonData = $$.utils.fmtJSONMsg(responseText);
            if (jsonData.status === 'success') {
                var unionId = jsonData.result.nextTerm + "-" + jsonData.result.openTerm + "-" + jsonData.result.result;
                //this._storeLastDataToRedis(this.option('redisPub'), JSON.stringify(this._buildJSONData({'version':unionId,'dataType':this.option('room'),'data':jsonData.result})));
                this.option('redisPub').publish(this.getPublishKey(), (function () {
                    //$$.logger.info((new Date) + ', notifyAll:push-client(' + self.option('room') + ')#version=' + unionId);
                    return JSON.stringify(self._buildJSONData({'version':unionId,'dataType':self.option('room'),'data':jsonData.result}));
                })(), function(err, reply, redisClient) {
                    if (err) {
                        $$.logger.info('error occured on publish command, the key is:' + self.getPublishKey() + ", err:" + err);
                        return;
                    }
                    try {
                        redisClient.end();
                    } catch (err) {
                        $$.logger.err('error occured on closing publish command, the key is:' + self.getPublishKey() + ", err:" + err);
                    }
                });
            }
        },
        end: 0
    });
    $$.xyscPushClient.defaults = {
        nextOpenTermAndTime: {nextOpenTerm:'0', leftOpenTime:0},
        room: 'klpk',
        remoteDataUrl:'http://sina.aicai.com/lotnew/kc/kc.htm?time=1405581063067&gameIndex=314',
        redisClusterNodes: [{host:'192.168.66.47',port:7000}, {host:'192.168.66.47',port:7001}, {host:'192.168.66.47',port:7002}],
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.xyscPushClient;
    }
    /*for Node.js end*/
});