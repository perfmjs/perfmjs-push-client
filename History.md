1.1.8 / 2015-01-6
 * improved: 提升perfmjs-node版本到1.4.1
 * improved: 提升perfmjs-redis-cluster版本到1.1.1

1.1.7 / 2014-09-25
 * add: 增加gd11x5

1.1.6 / 2014-09-20
 * remove: 移除不稳定的依赖shred
 * add: 增加http request依赖

1.1.5 / 2014-09-19
 * improved: 提升perfmjs-node版本到1.3.5
 * improved: 提升redis版本到0.12.1

1.1.4 / 2014-09-15
==================
 * add: 增加广东11x6, 快3，快乐扑克3的推送服务
 * improved: 提升perfmjs-node版本到1.3.3

1.1.3 / 2014-09-01
==================
 * improved: 提升perfmjs-node版本到1.3.2
 * improved: 提升perfmjs-redis-cluster版本到1.0.6
 * improved: 增加path以允许访问带上下文的socket.io路径，如：http://push.no100.com/klpk/socket.io/?EIO=2&transport=polling&t=1409577606338-0

1.1.2 / 2014-08-22
==================
 * improved: 提升prefmjs-node版本到1.2.9

1.1.2 / 2014-08-14
==================
 * fix: 修复彩期切换到第2天第1期时不能正常推送当天最后一期的彩期的BUG

1.1.1 / 2014-08-14
==================
 * improved: 提升perfmjs-node到1.2.8版本
 * add: 新增cluster功能

1.1.0 / 2014-07-31
==================
 * improved: using redis store last push data

1.0.9 / 2014-07-28
==================
 * fixed: fix some question about nextTime countdown

1.0.8 / 2014-07-25
==================
 * improved: add redis.end() after publish a key
 * modify: changed redis-cluster version to v1.0.2
 * improved: add nextOpenTerm leftTime logic and setTimeout about next day's first term
 * fix: fix some question about nextTime countdown

1.0.7 / 2014-07-24
==================
 * improved: improved redis cluster function

1.0.5 / 2014-07-16
==================
 * improved: improved perfmjs-node dependency to V1.2.4

1.0.4 / 2014-07-16
==================
 * improved: improved version of dependency: redis, prefmjs-node

1.0.3 / 2014-07-10
==================
 * improved: improved settimeout function using leftTime, leftOpenTime, etc

1.0.2 / 2014-07-09
==================
 * fix: add setTimeout to kc open result

1.0.1 / 2014-07-03
==================
 * add: add ssq push client

1.0.0 / 2014-07-02
==================
 * add: init project files

说明：修改类型为: improved(改善功能)/add(新增功能)/remove(移除功能)/modify(修复功能内容)/fix(修改BUG)