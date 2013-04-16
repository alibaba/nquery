// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Tool    = require('./tool');
var Adapter = require('./adapter');

var clone = Tool.clone;

exports.getRefColumns  = getRefColumns

function debug(str) {
  //console.log(str);  
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

function getRefColumns(expr) {
  var stack = [expr];
  var cur, t;
  var res = [];
  while(stack.length > 0) {
    cur = stack.pop(); 
    t = cur.type;
    switch (t) {
      case 'column_ref' :
        res.push(cur);
        break;
      case 'binary_expr':
        stack.push(cur.right);    
        stack.push(cur.left);    
        break;
      case 'unary_expr' :
        stack.push(cur.expr);
        break;
      case 'aggr_func'   :
        stack.push(cur.args.expr);
        break;
      case 'function'   :
        stack = stack.concat(cur.args.value);
        break;
      default:
        break;
    } 
  }
  return res;
}

exports.getSelRefCols =  function (sels) {
  // refCols
  // [{type : 'column_ref', column :}, ...] 
  var i, e, rc;
  var refCols = [];
  for (i = 0; i < sels.length; i++) {
    e  = sels[i].expr;
    //exprs.push(e);
    rc = getRefColumns(e);
    refCols = refCols.concat(rc);
  }  
  return refCols;
}

// {
//   id1 : {
//     cols : [rc1, rc2, rc3,...]
//     pos  : 2
//   } ,
//   id2 : {
//     cols : [,,] 
//     pos  :
//   }
// }
exports.getRefColInfo = getRefColInfo;
function getRefColInfo(refCols, columns) {
  //inspect(refCols);
  //inspect(columns);
  var i, obj, rc, key;
  var colMap = {};
  for (i = 0; i < refCols.length; i++) {
    rc  = refCols[i];
    key = rc.column;
    if (rc.table && rc.table != '') {
      key = rc.table + '.' + key;
    }
    obj = colMap[key];
    if (!obj) {
      obj = {};
      obj.cols = [];
      obj.pos  = getRowPosByCol(columns, rc);
      colMap[key] = obj;
    }
    obj.cols.push(rc);
  } 
  return colMap;
}

exports.getRowPosByCol = getRowPosByCol;

function getRowPosByCol(columns, col) {
  var pos = -1;
  var cols;
  var i, j;
  //debug('getRowPosByCol:');
  //inspect(columns);
  //inspect(col);
  for (i = 0; i < columns.length; i++) {
    cols = columns[i];
    for (j = 0; j < cols.length; j++) {
      if (col.table == cols[j].table && col.column == cols[j].column) {
        pos = i;
        break;
      }
    }
    if (pos >= 0) break;
  }
  if (pos < 0) {
    throw new Error('no column found for :' + col.table + '.' + col.column);  
  } else {
    return pos;  
  }
}

exports.getColNameByExpr = getColNameByExpr; 
function getColNameByExpr(expr) {
  var name;
  if (expr.type == 'column_ref') {
    name = expr.column; 
  } else {
    name = Adapter.exprToSQL(expr);
  }
  return name;
}

//this used to get the column name/alias 
//both for cloumn-clause and order by clause
exports.getColumnNames = getColumnNames;
function getColumnNames(columns) {
  //inspect(columns);
  var res = [];
  var i, as, name, c, cols, expr;
  for (i = 0; i < columns.length; i++) {
    cols = [];
    c = columns[i];
    expr = c.expr;
    if (expr.type == 'column_ref') {
      cols.push({
        table : expr.table,
        column: expr.column
      })
    } else {
      cols.push({
        table : '',
        column: Adapter.exprToSQL(expr)
      })
    }
    as = c.as;
    if (as && as != '') {   
      cols.push({
        table : '',
        column: as
      });
    } 
    res.push(cols);
  }
  return res;
}

exports.getRefColPos   = function(refCols, cols) {
  //debug('getRefColPos:');
  //inspect(refCols);
  //inspect(cols);
  var i, j, k, rc, cs, found;
  var refPos = [];
  for (i = 0; i < refCols.length; i++) {
    rc  = refCols[i];
    found = false;
    for (j = 0; j < cols.length; j++) {
      cs = cols[j];
      for (k = 0; k < cs.length; k++) {
        if (rc.column == cs[k].column) {
          if (!rc.table || rc.table == '' || (rc.table == cs[k].table)) {
            refPos.push(j);
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }
    if (found == false) {
      throw new Error('no column found for :' + rc.column);
    }
  }
  return refPos;
}

exports.backupRefCols = function(refCols) {
  return clone(refCols);
}

exports.restoreRefCols = function(refCols, rbackup) {
  //restore the cols
  var c, rb;
  for (var i = 0; i < refCols.length; i++) {
    c  = refCols[i];  
    rb = rbackup[i];
    c.type  = rb.type;
    c.value = undefined;
  }
}


//TODO, just work-around now ,recur checking needed
exports.checkAggrOp = function(gb, sels) {
  var ret = false;
  if (Array.isArray(gb) && gb.length > 0) {
    ret = true;
  } else if (Array.isArray(sels)) {
    for (var i = 0; i < sels.length; i++) {
      if (sels[i].expr.type == 'aggr_func') {
        ret = true;
        break;
      }
    }
  }
  return ret;
}

//for orderby columns ,if not existed in the select clause
//we need append it, after we doOrderby ,just skip thess columns
exports.expandSelect = function (sels, ob) {
  var res       = sels;
  var paddings  = [];
  var selCols   = getColumnNames(sels);

  //debug('expand Select:');
  //inspect(selCols);
  //inspect(ob);
  var i, j, k;
  var colNames;
  var table, column;
  var expr, eobj, found;
  for (i = 0; i  < ob.length; i++) {
    expr = ob[i].expr;
    if (expr.type == 'column_ref') {
      table  = expr.table;
      column = expr.column;
    } else {
      table  = '';
      column = Adapter.exprToSQL(expr);
    }
    found = false;
    for (j = 0; j < selCols.length; j++) {
      colNames = selCols[j];
      for (k = 0; k < colNames.length; k++) {
        if (colNames[k].table == table && colNames[k].column == column) {
          found = true;  
          break;
        }
      }
      if (found) break;
    }
    if (found == false) {
      paddings.push(ob[i]);
    }
  }
  if (paddings.length > 0) {
    res = res.concat(paddings);
  }
  //debug('expand result:');
  //inspect(res);
  return res;
}

exports.shrinkSelect = function(dc, selCols) {
  var allCols = dc.columns;
  var nsize = selCols.length;

  if (allCols.length > nsize) {
    var i, rows;
    var rows = dc.data;
    for (i = 0; i < rows.length; i++) {
      rows[i] = rows[i].slice(0, nsize);  
    }
    dc.columns = allCols.slice(0, nsize);
  }
  return dc;
}

exports.Reader = Reader 

function Reader(ast) {
  this._ast = ast;
}

Reader.prototype.getDB = function() {
  var dt = this._ast.from;
  var db = '';
  if (dt && Array.isArray(dt)) {
    db = dt[0].db; 
  }
  return db;
}

Reader.prototype.getTableAlias = function() {
  var dt = this._ast.from;
  var alias = '';
  if (dt && Array.isArray(dt)) {
    alias = dt[0].as; 
  }
  return alias;
}

Reader.prototype.getTableOrig = function() {
  var dt = this._ast.from;
  var orig = '';
  if (dt && Array.isArray(dt)) {
    orig = dt[0].table; 
  }
  return orig;
}

//get pure final colNames
Reader.prototype.getAsNames = function() {
  var cols = this._ast.columns;
  var res = [];
  if (Array.isArray(cols)) {
    var i, c, as, expr;
    for (i = 0; i < cols.length; i++) {
      c = cols[i];
      as = c.as;
      if (as == '') {
        expr = c.expr
        as = getColNameByExpr(expr);
      }
      res.push(as);
    }
  }
  return res;
}

Reader.prototype.getOrderby = function() {
  var res = [];
  var ods = this._ast.orderby;
  var obj;
  if (Array.isArray(ods)) {
    var i, obj, expr;
    for (i = 0; i < ods.length; i++) {
      expr = ods[i].expr;
      if (expr.type == 'column_ref') {
        obj = {
          table : expr.table,
          column: expr.column
        }
      } else {
        obj = {
          table : '',
          column : Adapter.exprToSQL(expr)
        }
      }
      res.push({
        type    : ods[i].type,
        name    : obj
      });
    }
  }
  return res;
}

Reader.prototype.getGroupby = function() {
  var res = [];
  var ods = this._ast.groupby;
  if (Array.isArray(ods)) {
    var obj ;;
    for (var i = 0; i < ods.length; i++) {
      obj = {
        table : ods[i].table,
        column: ods[i].column
      }
      res.push(obj);
    }
  }
  return res;
}

Reader.prototype.getLimits = function() {
  var res = [];
  var lm = this._ast.limit;
  if (Array.isArray(lm) && lm.length == 2) {
    res.push(lm[0].value);
    res.push(lm[1].value);
  }
  return res;
}

Reader.prototype.isDistinct = function() {
  return this._ast.distinct == 'DISTINCT';
}

Reader.prototype.getType = function() {
  return this._ast.type ;
}

Reader.prototype.getAst = function() {
  return this._ast;
}

exports.fillExprOnRow = function(row, refCols, refPos) {
  var c, pos, val;
  for (var j = 0; j < refCols.length; j++) {
    c   = refCols[j];
    pos = refPos[j];
    val = row[pos];
    //inspect(e);
    fill(c, val);
  }
}

exports.createBinaryExpr = function(op, left, right) {
  var o = {
    operator: op,
    type    : 'binary_expr'
  }
  if (left && left.type) {
    o.left = left;
  } else {
    o.left = fill({}, left); 
  }
  
  if (op == 'BETWEEN' ) {
    var beg = fill({}, right[0])  
    var end = fill({}, right[1])  
    o.right = {
      type : 'expr_list',
      value :[beg, end]
    };
  } else {
    if ((right && right.type) || Array.isArray(right)) {
      o.right = right;
    } else {
      o.right = fill({}, right); 
    }
  }
  return o;
}

exports.fill  = fill; 

function fill(tpl, v) {
  var t = typeof v;
  if (t == 'string') {
    tpl.type = 'string';
    tpl.value = v;
  } else if (t == 'number') {
    tpl.type = 'number';
    tpl.value = v;
  } else if (t === 'boolean') {
    tpl.type = 'bool';
    tpl.value = v;
  } else if (v === null) {
    tpl.type = 'null',
    tpl.value = null
  } else {
  } 
  return tpl;
}

  
