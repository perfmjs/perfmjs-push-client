/**
 * 快乐扑克3 Push Publish Client
 * Created by Administrator on 2014/7/3.
 */
require('perfmjs-node');
require('./push-client-kc');
perfmjs.plugin('gxk3PushClient', function($$) {
    $$.base("kcPushClient.gxk3PushClient", {
        init: function(initParam) {
            this.option('redisPub', $$.redisCluster.instance.initStartupOptions(this.option('redisClusterNodes')));
            this._handleOpenData();
            return this;
        },
        end: 0
    });
    $$.gxk3PushClient.defaults = {
        room: 'gxk3',
        totalTermNum: 78,
        remoteDataUrl:'http://www.aicai.com/lottery/kc!kc3.jhtml?gameIndex=316',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.gxk3PushClient;
    }
    /*for Node.js end*/
});