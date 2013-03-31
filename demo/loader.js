// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var nQuery    = require('../index')

var Adapter   = nQuery.Adapter;
var Context   = nQuery.Context;
var Extractor = nQuery.Extractor;

var kvInfo = {};
var dbInfo = {};

exports.setDBInfo = function(info) {
  dbInfo = info;
}

exports.setKVInfo = function(info) {
  kvInfo = info;
}

exports.load = load;


function debug(str) {
  console.log(str);  
}

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10));  
}

function load(ar, ctx, cb) {
//you could copy these functions
  var db = ar.getDB();
  //debug('db : ' + db);

  var info = dbInfo[db];

  if (!info) {
    cb(new Error('no registered db info found...'));
    return;
  }

  var engine = info.storageEngine;
  if (!engine) {
    cb(new Error('no registered load found for :' + db));
    return;
  }

  var dbType = info.storageType;

  if (dbType == 'kv') {
    var table = ar.getTableOrig();
    var dt = db + '.' + table;

    var opt = kvInfo[dt];

    if (!opt) {
      cb(new Error('no registered kv table info found for :' + dt));
      return;
    }
    kvLoad(ar, ctx, engine, opt, cb);
  } else if (dbType == 'sql') {
    sqlLoad(ar, ctx, engine, cb);
  } else {
    cb(new Error('unrecognized db type : ') + dbType);
  }
}

function sqlLoad(ar, ctx, engine, cb) {
  Context.setctx(ctx);
  var ast = ar.getAst();
  var str = Adapter.toSQL(ast, ctx);

  //debug('do sqlLoad: ' + str);
  engine.query(str, function(err, dc, info) {
    //in most cases, the post-filter was null or undefined
    cb(err, dc);
  });
}

function kvLoad(ar ,ctx, engine, opt, cb) {
  Context.setctx(ctx);
  var ast   = ar.getAst();
  var info  = Extractor.getKeyInfo(ast.where, opt);

  if (!info) {
    cb(new Error('no registered db info found...'));
    return;
  }
  //inspect(info);

  var inKeys    = info['IN'] ||  [];
  var btwKeys   = info['BETWEEN'] || [];
  var likeKeys  = info['LIKE'] || [];
  
  var dcs = [];

  var i, dc;
  //here we use sync-method just for demostration,
  //in fact ,you should use async instead
  for (i = 0; i < inKeys.length; i++) {
    dc = engine.singleQuery(inKeys[i]);
    dcs.push(dc);
  }

  for (i = 0; i < btwKeys.length; i++) {
    dc = engine.rangeQuery(btwKeys[i][0], btwKeys[i][1]);
    dcs.push(dc);
  }

  for (i = 0; i < likeKeys.length; i++) {
    dc = engine.likeQuery(likeKeys[i]);
    dcs.push(dc);
  }

  dc = dataUnion(dcs); 

  cb(null, dc, ar);
}

function dataUnion(dcs) {
  var res = {};
  var dc;
  for (var i = 0; i < dcs.length; i++) {
    dc = dcs[i];
    //here maybe you should use clone instead
    if (i == 0) {
      res.columns = dc.columns;
      res.data = dc.data;
    } else {
      res.data = res.data.concat(dc.data);
    }
  }
  return res;
}

