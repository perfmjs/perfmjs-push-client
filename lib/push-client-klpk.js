/**
 * 快乐扑克3 Push Publish Client
 * Created by Administrator on 2014/7/3.
 */
require('perfmjs-node');
require('./push-client-kc');
perfmjs.plugin('klpkPushClient', function($$) {
    $$.base("kcPushClient.klpkPushClient", {
        init: function(initParam) {
            this.options['redisPub'] = $$.redisCluster.instance.initStartupOptions(this.option('redisClusterNodes'));
            this._handleOpenData();
            return this;
        },
        end: 0
    });
    $$.klpkPushClient.defaults = {
        room: 'klpk',
        totalTermNum: 79,
        remoteDataUrl:'http://sina.aicai.com/lotnew/kc/kc.htm?time=1405581063067&gameIndex=314',
        end: 0
    };
    /*for Node.js begin*/
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = perfmjs.klpkPushClient;
    }
    /*for Node.js end*/
});