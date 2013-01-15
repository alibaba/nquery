// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Engine    = require('./engine');
var Context   = require('./context');

var run             = Engine.run;
var getExprListVal  = Engine.getExprListVal;

//kv storage info 
/*
{
  storageType   : 'kv',
  primaryKeys   : [id, name],
  prefixMatch   : true,
  rangeSupport  : true
}
*/

exports.getKeyInfo = getKeyInfoOnWhere;

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10));
}

function debug(str) {
  //console.log(str);
}

function splitOrExpr(where) {
  var cur, t;
  var res = [];
  var stack = [where];
  while(stack.length > 0) {
    cur = stack.pop(); 
    if (cur.type == 'binary_expr' && cur.operator == 'OR') {
      stack.push(cur.right);
      stack.push(cur.left);
    } else {
      res.push(cur)
    }
  }
  return res;
}

function getKeyInfoOnAndExpr(expr, options) {
  var cur, t, info;
  var res = {};
  var stack = [expr];
  var k, val;
  while(stack.length > 0) {
    cur = stack.pop(); 
    t = cur.type;
    if (t == 'binary_expr') {
      var l  = cur.left;
      var r  = cur.right;
      var op = cur.operator;
      if (op == 'AND'  || op == 'OR') {
        stack.push(r);
        stack.push(l);
      } else if (l.type == 'column_ref') {
        if (info = getKeyColumn(l, r, op, options)) {
          mergeKeyInfo(res, info);
        }
      }
    }
  }
  return res;
}

function mergeKeyInfo(res, info) {
  var k, val;
  for(k in info) {
    if (res[k] == undefined) {
      res[k] = [];
    }
    val = info[k];
    if (k == 'IN' && Array.isArray(val)) {
      //only single-key batch values could be pushed 
      res[k] = res[k].concat(val);
    } else {
      res[k].push(val);  
    }
  }
}

function appendKeyInfo(res, info) {
  var k, val;
  for(k in info) {
    if (res[k] == undefined) {
      res[k] = info[k];
    } else {
      res[k] = res[k].concat(info[k]);
    }
  }
}

function getKeyColumn(l, r, op, options) {
  var keys = options.primaryKeys;
  var res;
  //TODO ,now only support single primary key
  if (keys.length == 1) {
    var key = keys[0];
    if (l.column == key) {
      //TODO , check types
      if (op == '=' || op == 'IN') {
        res = {};
        if (typeof(r) == 'object' && r.type == 'expr_list') {
          res['IN'] = getExprListVal(r);
        } else {
          res['IN'] = run(r);
        }
      } if (options.rangeQuery && op == 'BETWEEN') {
        res = {};
        if (typeof(r) == 'object' && r.type == 'expr_list') {
          res['BETWEEN'] = getExprListVal(r);
        } else {
          var rbeg = run(r[0]);
          var rend = run(r[1]);
          res['BETWEEN'] = [rbegin, rend];
        }
      } if (options.prefixMatch && op == 'LIKE') {
        var val = run(r);
        if (typeof val == 'string') {
          var pos = val.indexOf('%');
          if (pos > 0 && pos == val.length - 1) {
            res = {};
            res['LIKE'] = val.substr(0, pos);
          }
        }
      }
    }
  }
  return res;
}

function getKeyInfoOnWhere(where, options) {
  var i ,info;
  var res = {};
  var andExprs = splitOrExpr(where);
  debug('AndExprs');
  inspect(andExprs);
  for (i = 0; i < andExprs.length; i++) {
    info = getKeyInfoOnAndExpr(andExprs[i], options);
    //inspect(info);
    if (Object.keys(info).length == 0) {
      throw Error('requird primary keys not ful-filled');
    } else {
      appendKeyInfo(res, info);
    }
  }
  return res;
}

