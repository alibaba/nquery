// (C) 2011-2012 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

// if the column was embedded in the in , between ,etc, 
// it would be ignored
var Tool    = require('./tool');
var Adapter = require('./adapter');

var clone = Tool.clone;

exports.getRefColumns  = getRefColumns

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
      obj.pos  = getRowPosByCol(columns, key);
      colMap[key] = obj;
    }
    obj.cols.push(rc);
  } 
  return colMap;
}

exports.getRowPosByCol = getRowPosByCol;

function getRowPosByCol(columns, col) {
  var pos = -1;
  for (var i = 0; i < columns.length; i++) {
    if (columns[i].indexOf(col) >= 0) {
      pos = i;
      break;
    }
  }
  if (pos < 0) {
    throw new Error('no column found for :' + col);  
  } else {
    return pos;  
  }
}

//this used to get the column name/alias 
//both for cloumn-clause and order by clause
exports.getColumnNames = getColumnNames;
function getColumnNames(columns) {
  //inspect(columns);
  var res = [];
  var as, name, c, cols;
  for (var i = 0; i < columns.length; i++) {
    cols = [];
    c  = columns[i];
    name = Adapter.exprToSQL(c.expr);
    cols.push(name);

    as = c.as;
    if (as && as != '') {   
      cols.push(as);
    } 
    res.push(cols);
  }
  //inspect(res);
  return res;
}

exports.getRefColPos   = function(refCols, cols) {
  var i, j,c, tc;
  var refPos = [];
  for (i = 0; i < refCols.length; i++) {
    c  = refCols[i];
    tc = c.column;
    if (c.table && c.table != '') {
      tc = c.table + '.' + tc 
    }
    var found = false;
    for (j = 0; j < cols.length; j++) {
      if (cols[j].indexOf(tc) >= 0) {
        refPos.push(j);  
        found = true;
        break;
      }
    }
    if (found == false) {
      throw new Error('no column found for :' + tc);
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
  var selCols   = getColumnNames(sels);

  var i, j;
  var expr, estr, found;
  var paddings  = [];
  for (i = 0; i  < ob.length; i++) {
    estr = Adapter.exprToSQL(ob[i].expr); 
    found = false;
    for (j = 0; j < selCols.length; j++) {
      if (selCols[j].indexOf(estr) >= 0) {
        found = true;  
        break;
      } 
    }
    if (found == false) {
      paddings.push(ob[i]);
    }
  }
  if (paddings.length > 0) {
    res = res.concat(paddings);
  }
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
    var as = '';
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      as = c.as;
      if (as == '') {
        var expr = c.expr
        if (expr.type == 'column_ref') {
          as = expr.column;
        } else {
          as = Adapter.exprToSQL(expr);
        }
      }
      res.push(as);
    }
  }
  return res;
}

Reader.prototype.getOrderby = function() {
  var res = [];
  var ods = this._ast.orderby;
  if (Array.isArray(ods)) {
    var estr;
    for (var i = 0; i < ods.length; i++) {
      estr = Adapter.exprToSQL(ods[i].expr);
      res.push({
        type : ods[i].type,
        name : estr
      });
    }
  }
  return res;
}

Reader.prototype.getGroupby = function() {
  var res = [];
  var ods = this._ast.groupby;
  if (Array.isArray(ods)) {
    var estr;
    for (var i = 0; i < ods.length; i++) {
      estr = Adapter.exprToSQL(ods[i]);
      res.push(estr);
    }
  }
  return res;
}

Reader.prototype.getTableOrig = function() {
  var dt = this._ast.from;
  var alias = '';
  if (dt && Array.isArray(dt)) {
    alias = dt[0].table; 
  }
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
    o.right = [beg, end];
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

  
exports.run = run; 

//only `NOT` or `!` now
function runUnaryExpr(e) {
  return !(run(e.expr));
}

function debug(str) {
  console.log(str);  
}

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

function run(e) {
  //inspect(e);
  var t = e.type;
  var res;
  //todo
  switch (t) {
    case 'unary_expr' :  
      res = runUnaryExpr(e); 
      break;
    case 'binary_expr':  
      res = runBinaryExpr(e);
      break;
    //TODO, now only count is claasified as aggr
    case 'aggr_func':  
      res = runAggrFunc(e);
      break;
    case 'function'   :  
      res = runFunction(e);
      break;
    default :
      //for number ,string , bool, null
      res = e.value;
  }
  return res;
}

function runBinaryExpr(e){
  var op    = e.operator;
  var left  = e.left;
  var right = e.right;
  var res;
  switch(op) {
    case '+'      :  
      res = run(left) + run(right);
      break;
    case '-'      :  
      res = run(left) - run(right);
      break;
    case '*'      :  
      res = run(left) * run(right);
      break;
    case '/'      :  
      res = run(left) / run(right);
      break;
    case '%'      :  
      res = run(left) % run(right);
      break;
    case '='      :  
      res = run(left) == run(right);
      break;
    case '>'      :  
      res = run(left) >  run(right);
      break;
    case '>='     :  
      res = run(left) >= run(right);
      break;
    case '<'      :  
      res = run(left) < run(right);
      break;
    case '<='     :  
      res = run(left) <= run(right);
      break;
    case '!='     :  
    case '<>'     :  
      res = run(left) != run(right);
      break;
    case 'IS'     :  
      res = run(left) == run(right);
      break;
    case 'BETWEEN':  
      var lval = run(left);
      var rbeg = run(right[0]);
      var rend = run(right[1]);
      res = (lval >= rbeg && lval <= rend);
      break;
    case 'IN'     :  
      var lval = run(left);
      var rarr = getExprListVal(right);
      res = (rarr.indexOf(lval) >= 0)
      break;
    case 'NOT IN' :  
      var lval = run(left);
      var rarr = getExprListVal(right);
      res = (rarr.indexOf(lval) < 0);
      break;
    case 'AND'    :  
      var lval = run(left);
      var rval = run(left);
      res = (lval && rval)
      break;
    case 'OR'    :  
      var lval = run(left);
      if (lval) {
        res = true;  
      } else {
        res = run(right);
      }
      break;
    default :
      res = 'binary operator not supported now :' + op
  }
  return res;
}

/**
* { 
*   type: 'expr_list',
*   value: [ 
*     { 
*       type: 'literal_list',
*       table: 'a',
*       column: 'id',
*       value: [ 1, 2, 2, 3, 3, 5, 6 ] 
*     } 
*   ] 
* } 
*/
function getAggrListVal(eList) {
  var res = [];
  if (Array.isArray(eList)) {
    return eList; 
  }else if (eList && eList.value && 
      eList.value[0] && 
      Array.isArray(eList.value[0].value)) {
    res = eList.value[0].value;
  }
  return res;
}

function getExprListVal(eList) {
  var res = [];  
  if (Array.isArray(eList)) {
    res = eList;  
  } else if (eList.type == 'expr_list') {
    var vals = eList.value;
    for (var i = 0; i < vals.length; i++) {
      res.push(vals[i].value);
    }
  } else {
    throw new Error('error expr list type'); 
  }
  return res;
}

var fnMap = {
  'FLOOR'   : floor,
  'CEIL'    : ceiling,
  'CEILING' : ceiling,
};

var aggrMap = {
  'MAX'     : max,
  'MIN'     : min,
  'COUNT'   : count,
  'SUM'     : sum,
  'AVG'     : avg
}

//todo, do distinct filter or something
function runAggrFunc(e) {
  var fn = aggrMap[e.name];
  return fn(e.args);
}

function runFunction(e) {
  var name = e.name;
  if (name) {
    name = name.toUpperCase();
  }
  var fn;
  var args;
  if (fn = fnMap[name]) {
    args = getExprListVal(e.args); 
    return fn(args);
  } else {
    throw new Error('function not supported for :' + e.name);  
  }
}

function count(args){
  var ret;
  var arr = getAggrListVal(args.expr.value);
  if (Array.isArray(arr)) {
    ret = arr.length;
  } else {
    ret = 1;
  }
  return ret;
}

function max(args){
  //debug('call max');
  //inspect(arr);
  var ret;
  var arr = getAggrListVal(args.expr.value);
  if(Array.isArray(arr)){
    ret = arr[0];
    for(var i = 1; i < arr.length; i++){
      if(arr[i] > ret) ret = arr[i];
    }
  }
  return ret;
}

function min(args){
  //debug('call max');
  //inspect(arr);
  var ret;
  var arr = getAggrListVal(args.expr.value);
  if(Array.isArray(arr)){
    ret = arr[0];
    for(var i = 1; i < arr.length; i++){
      if(arr[i] < ret) ret = arr[i];
    }
  }
  return ret;
}

//we only deal the first arg,
function floor(arr){
  if(Array.isArray(arr)){
    return Math.floor(arr[0]);
  } else {
    return Math.floor(arr);
  }
}

function ceiling(arr){
  if(Array.isArray(arr)){
    return Math.ceil(arr[0]);
  } else {
    return Math.ceil(arr);
  }
}

function sum(args){
  //debug('call sum');
  //inspect(arr);
  var ret;
  var arr = getAggrListVal(args.expr.value);
  if (Array.isArray(arr)){
    ret = arr[0];
    for(var i = 1; i < arr.length; i++){
      ret += arr[i];
    }
  }
  return ret;
}

function avg(args){
  //debug('call sum');
  //inspect(arr);
  var ret;
  var len = 1;
  var arr = getAggrListVal(args.expr.value);
  if(Array.isArray(arr)){
    ret = arr[0];
    for(var i = 1; i < arr.length; i++){
      ret += arr[i];
    }
    len = arr.length;
  }
  return ret/len;
}
