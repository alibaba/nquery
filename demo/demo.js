// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var KV        = require('./kv');
var Mysql     = require('./mysql');
var Loader    = require('./loader');

var nQuery    = require('../index');
var Query     = nQuery.Query;
var Context   = nQuery.Context;
var Executor  = nQuery.Executor;

function debug(str) {
  console.log(str);  
}

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10));  
}

var kvInfo = {
  'kv.user' : {
    primaryKeys : ['id'],
    prefixMatch : true,
    rangeQuery  : true
  }
}

var dbInfo = {
  kv: {
    storageType   : 'kv', 
    storageEngine : KV
  },
  mysql : {
    storageType   : 'sql',
    storageEngine : Mysql
  }
}


function main() {
  Loader.setDBInfo(dbInfo);
  Loader.setKVInfo(kvInfo);

  Executor.setLoader(Loader.load);

  var sqls = [
     "SELECT * FROM kv.user WHERE id IN ('01', '03')",
     "SELECT * FROM kv.user WHERE id LIKE '1%'",
     "SELECT type, MAX(age), COUNT(id) FROM kv.user WHERE id BETWEEN '03' AND '10' GROUP BY type ORDER BY MAX(age) DESC",
     "SELECT * from mysql.shop where shop_id > 5"
  ]

  var concurrentJoinSQL = [
    "$a := select * from kv.user where id BETWEEN '03' and '10'",
    "$b := select * from mysql.shop where shop_id > 5",
    "$c := select a.type , a.id ,b.name, b.title from $a INNER JOIN $b ON a.type = b.type WHERE a.id > '04'",
    "return $c"
  ]

  var sequentialJoinSQL = [
    "$a := select * from kv.user where id BETWEEN '03' and '10'",
    //you could also use `unique` do filter firstly
    //"$type := UNIQUE($a.type)",
    //"$b := select * from mysql.shop where type = $type",
    "$b := select * from mysql.shop where type in $a.type",
    "$c := select a.type , a.id ,b.name, b.title from $a INNER JOIN $b ON a.type = b.type WHERE a.id > '04'",
    "return [$b, $c]"
  ]

  printSeperator();

  for (var i = 0; i < sqls.length; i++) {
    doQuery(sqls[i]);
  }

  doQuery(concurrentJoinSQL.join('\n'));

  doQuery(sequentialJoinSQL.join('\n'));
}

function printSeperator() {
  var str = '';
  for(var i = 0; i < 80; i++) {
    str += '-'
  }
  debug(str);
}

function doQuery(sql) {
  Query.runSQL(sql, function(err, dc) {
    if (err) {
      if (err.stack) {
        debug(err.stack);  
      } else {
        debug(err);  
      }
    } else {
      debug('sql :');
      debug('' + sql);
      debug('\ndata:');
      inspect(dc);
      printSeperator();
    }
  });
}

main();
