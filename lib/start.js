/**
 * ssq push client
 * Created by Administrator on 2014/7/3.
 */
require("perfmjs-node");
perfmjs.ready(function($$, app) {
    app.register('kcPushClient', require("./push-client-kc"));
    app.start('kcPushClient');
    $$.logger.info("已启动后台数据推送Node.JS客户端!");
});