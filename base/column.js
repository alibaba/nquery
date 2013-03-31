// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Tool            = require('../lib/tool');
var Engine          = require('../lib/engine');
var Adapter         = require('../lib/adapter');
var AstHelper       = require('../lib/ast_helper');

var doGroupby       = require('./groupby');
var doAggregation   = require('./aggregation');

var runExpr         = Engine.run;

var checkAggrOp     = AstHelper.checkAggrOp;
var getRefColPos    = AstHelper.getRefColPos;
var getRefColumns   = AstHelper.getRefColumns;

var getSelRefCols   = AstHelper.getSelRefCols;
var getRefColInfo   = AstHelper.getRefColInfo;

var fillExprOnRow   = AstHelper.fillExprOnRow;
var backupRefCols   = AstHelper.backupRefCols;
var getColumnNames  = AstHelper.getColumnNames;
var restoreRefCols  = AstHelper.restoreRefCols;


function debug(str) {
  //console.log(str);  
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10));  
}

module.exports = filter;

/**
** @param {Array} gb, groupby columns
*/
function filter(dc, sels, gb) {
  if (sels == '*') {
    return dc;
  } 
  var rows;
  if (checkAggrOp(gb, sels)) {
    rows = selectAggr(dc, sels, gb);
  } else {
    rows = selectCol(dc, sels);  
  } 

  var cols = getColumnNames(sels);

  return  {
    columns : cols,
    data    : rows
  }
}

function selectAggr(dc, sels, gb) {
  var refCols = getSelRefCols(sels); 
  var rcInfo  = getRefColInfo(refCols, dc.columns);
  var rbackup = backupRefCols(refCols);

  var gds;
  if (Array.isArray(gb) && gb.length > 0) {
    gds = doGroupby(dc, gb);
  } else {
    gds = {
      _ : dc  
    }  
  }
  var r, gd, key;
  var rows = [];
  for (key in gds) {
    dc = gds[key];
    r = doAggregation(dc, sels, rcInfo);
    rows.push(r);
  }
  restoreRefCols(refCols, rbackup);
  return rows;
}

function selectCol(dc, sels) {
  // refCols
  // [
  //   [aid, bid],
  //   [cid, aid],
  //   [cid, bid],
  //   [aid]
  // ] 
  var exprs   = [];
  var refPos  = [];
  var refCols = [];
  var rbackup = [];
  var i, j, e, rc, rp, rb;
  var columns = dc.columns;
  for (i = 0; i < sels.length; i++) {
    e = sels[i].expr;
    rc = getRefColumns(e);
    rp = getRefColPos(rc, columns)

    exprs.push(e);
    refPos.push(rp);
    refCols.push(rc);

    rb = backupRefCols(rc);
    rbackup.push(rb);
  }  

  var rs;
  var data = [];
  var r, val, row;
  var rows = dc.data;
  for (i = 0; i < rows.length; i++) {
    r = rows[i];
    row = [];
    for (j = 0; j < exprs.length; j++) {
      fillExprOnRow(r, refCols[j], refPos[j]);
      val = runExpr(exprs[j]); 
      row.push(val);
    }
    data.push(row);
  }

  //restore
  for (i = 0; i< refCols.length; i++) {
    restoreRefCols(refCols[i], rbackup[i]);
  }
  //inspect(rbackup);
  return data;
}
