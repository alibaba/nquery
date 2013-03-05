// (C) 2011-2012 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var AstHelper     = require('./ast_helper');

var runExpr       = AstHelper.run;
var fillExprOnRow = AstHelper.fillExprOnRow

function debug(str) {
  console.log(str);  
}

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

module.exports = filter;

function filter(dc, e) {

  var cols = dc.columns;
  var rows = dc.data;

  //inspect(dc);
  var res = [];
  var refCols = AstHelper.getRefColumns(e);
  var refPos  = AstHelper.getRefColPos(refCols, cols);
  //inspect(refPos);

  var rbackup = AstHelper.backupRefCols(refCols);
  var i, r;
  for (i = 0; i < rows.length; i++) {
    r = rows[i];
    //debug('row : ' + i);
    fillExprOnRow(r, refCols, refPos);
    if (runExpr(e)) {
      res.push(r);  
    }
  }

  AstHelper.restoreRefCols(refCols, rbackup);
  //debug('after filter');
  //inspect(refCols);
  return {
    columns : cols,
    data    : res
  }
}
