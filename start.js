/**
 * ssq push client
 * 后台启动 /usr/local/node/bin/forever start -a -l /www/perfmjs-push-client-1.1.0/logs/forever.log -o logs/out.log -e logs/err.log start.js; tail -f ./logs/out.log
 * Created by Administrator on 2014/7/3.
 */
require("perfmjs-node");
perfmjs.ready(function($$, app) {
    var cluster = require('cluster');
    if (cluster.isMaster) {
        var cpuCount = 1;
        $$.logger.info("将启动" + cpuCount + "个工作线程......");
        //启动工作线程
        for (var i = 0; i < cpuCount; i += 1) {
            cluster.fork();
        }
        cluster.on('online', function(worker) {
            $$.logger.info('工作线程:' + worker.id + ' is online.');
        });
        cluster.on('exit', function(worker, code, signal) {
            $$.logger.info('工作线程：' + worker.id + ' 挂了，将重启一个新的工作线程…………,signal:' + signal);
            if (worker.id < 100) {
                cluster.fork();
            }
        });
    } else {
        app.register(require('perfmjs-redis-cluster'));
        app.register(require("./lib/push-client-klpk"));
        app.startAll();
        $$.logger.info("已启动后台数据推送Node.JS客户端!, cluster.worker.id = " + cluster.worker.id);
    }
});