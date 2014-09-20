/**
 * 快乐扑克3 Push Publish Client
 * Created by Administrator on 2014/7/3.
 */
require('perfmjs-node');
require('./push-client-kc');
perfmjs.plugin('dj11yPushClient', function($$) {
    $$.base("kcPushClient.dj11yPushClient", {
        init: function(initParam) {
            this.options['redisPub'] = $$.redisCluster.instance.initStartupOptions(this.option('redisClusterNodes'));
            this._handleOpenData();
            return this;
        },
        end: 0
    });
    $$.dj11yPushClient.defaults = {
        room: '11ydj',
        totalTermNum: 78,
        remoteDataUrl:'http://www.aicai.com/lottery/kc!kc11x5.jhtml?gameIndex=303',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.dj11yPushClient;
    }
    /*for Node.js end*/
});