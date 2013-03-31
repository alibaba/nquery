// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Tool      = require('../lib/tool');
var Engine    = require('../lib/engine');
var AstHelper = require('../lib/ast_helper');

var runExpr         = Engine.run;
var getSelRefCols   = AstHelper.getSelRefCols;
var getRefColInfo   = AstHelper.getRefColInfo;

var backupRefCols   = AstHelper.backupRefCols;
var restoreRefCols  = AstHelper.restoreRefCols;

function debug(str) {
  //console.log(str);  
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10));  
}

module.exports = doAggregation;

function doAggregation(dc, sels, info) {
  // {
  //   id1 : {
  //     cols : [val1, val2, val3,...]
  //     pos  : 2
  //   } ,
  //   id2 : {
  //     cols : [,,] 
  //     pos  :
  //   }
  // }
  if (!info) {
    var refCols = getSelRefCols(sels); 
    info  = getRefColInfo(refCols, dc.columns);
  }
  //inspect(refCols);

  var i, key, pos, vals;
  var valMap = {};
  var rows = dc.data;
  for (key in info) {
    vals = [];
    pos = info[key].pos;
    for (i = 0; i < rows.length; i++) {
      vals.push(rows[i][pos]);
    }
    valMap[key] = vals;
  }
  //inspect(valMap);
  var rc;
  for (key in info) {
    rc = info[key].cols;
    vals = valMap[key]; 
    for (i = 0; i < rc.length; i++) {
      rc[i].type = 'literal_list';
      rc[i].value = vals;
    }
  }

  var val;
  var row = [];
  for (i = 0; i < sels.length; i++) {
    val = runExpr(sels[i].expr);
    //for no aggr fuctions
    if (Array.isArray(val)) {
      val = val[0];  
    }
    row.push(val);
  }
  return row;
}
