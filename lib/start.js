/**
 * ssq push client
 * 后台启动 /usr/local/node/bin/forever start -a -l /www/perfmjs-push-client-1.0.8/logs/forever.log -o logs/out.log -e logs/err.log ./lib/start.js; tail -f ./logs/out.log
 * Created by Administrator on 2014/7/3.
 */
require("perfmjs-node");
perfmjs.ready(function($$, app) {
    app.register('redisCluster', require('perfmjs-redis-cluster'));
    app.register('klpkPushClient', require("./push-client-klpk"));
    app.startAll();
    $$.logger.info("已启动后台数据推送Node.JS客户端!");
});