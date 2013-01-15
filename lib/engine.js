// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Table     = require('./table');
var Context   = require('./context');

exports.run = run; 

function debug(str) {
  //console.log(str);  
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
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
    case 'var':
      res = Context.getBindVar(e);
      break;
    case 'array':
      //debug('arr');
      //inspect(e);
      res = getArrayVal(e);
      // code
      break;
    default :
      //for number ,string , bool, null
      res = e.value;
  }
  return res;
}

//only `NOT` or `!` now
function runUnaryExpr(e) {
  return !(run(e.expr));
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
    case 'LIKE'   :  
      var lval = run(left);
      var rval = run(right);
      res = like(lval, rval);
      break;
    case 'BETWEEN':  
      var lval = run(left);
      var rarr = getExprListVal(right);
      var rbeg = rarr[0];
      var rend = rarr[1];
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

function getArrayVal(e) {
  var res = []; 
  var vals = e.value;
  var v;
  for (var i = 0; i < vals.length; i++) {
    v = run(vals[i]);
    res.push(v);
  }
  return res;
}

exports.getExprListVal = getExprListVal;

function getExprListVal(eList) {
  var res = [];  
  if (Array.isArray(eList)) {
    res = eList;  
  } else if (eList.type == 'expr_list') {
    res = getArrayVal(eList);
    /*
    var vals = eList.value;
    for (var i = 0; i < vals.length; i++) {
      res.push(vals[i].value);
    }
    */
  } else {
    throw new Error('error expr list type'); 
  }
  return res;
}

var fnMap = {
  'FLOOR'   : floor,
  'CEIL'    : ceiling,
  'CEILING' : ceiling,
  'UNIQUE'  : unique
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
    debug('fn : ' + name);
    debug('args: ');
    inspect(args);
    return fn(args);
  } else {
    throw new Error('function not supported for :' + e.name);  
  }
}

function like(str, pattern) {
  //now only support 'str%' or 'str'
  //console.log('str: ' + str + ', pattern : '+ pattern);
  var pos = pattern.indexOf('%');
  if (pos < 0) {
    return (str.indexOf(pattern) >= 0);  
  } else {
    var p = pattern.substr(0, pos);
    if (pos == pattern.length - 1) {
      return (str.indexOf(p) == 0); 
    } else {
      return (str.indexOf(p) >= 0); 
    }
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

function unique(arr){
  var res = [];
  var map = {};
  var ele, key;
  for (var i = 0; i < arr.length; i++){
    ele = arr[i];
    key = (typeof ele ) + ele;
    if(map[key] === undefined){
      map[key] = true;
      res.push(ele);
    } 
  }
  return res;
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

