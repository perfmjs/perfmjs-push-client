/**
 * 快乐扑克3 Push Publish Client
 * Created by Administrator on 2014/7/3.
 */
require('perfmjs-node');
require('./push-client-kc');
perfmjs.plugin('gd11x5PushClient', function($$) {
    $$.base("kcPushClient.gd11x5PushClient", {
        init: function(initParam) {
            this.options['redisPub'] = $$.redisCluster.instance.initStartupOptions(this.option('redisClusterNodes'));
            this._handleOpenData();
            return this;
        },
        end: 0
    });
    $$.gd11x5PushClient.defaults = {
        room: 'gd11x5',
        totalTermNum: 84,
        remoteDataUrl:'http://www.aicai.com/lottery/kc!kc11x5.jhtml?gameIndex=305',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.gd11x5PushClient;
    }
    /*for Node.js end*/
});