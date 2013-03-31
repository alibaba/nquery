// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Tool      = require('../lib/tool');
exports.order = order;

function debug(str) {
  //console.log(str);
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10));  
}

function order(stmts) {
  var i, j, o, v, s;
  var rs, ds;
  var nodes = [];
  var deps  = [];
  for (i = 0; i < stmts.length; i++) {
    s = stmts[i];
    deps = [];
    if (s.stmt && s.stmt.type == 'assign') {
      v = s.vars[0];
      ds = s.vars;
      for (j = 0; j < ds.length; j++) {
        if (ds[j] != v) deps.push(ds[j]);
      }
    } else if (s.stmt && s.stmt.type == 'return') {
      if (i != stmts.length -1 ) {
        throw new Error('return statement should be the LAST');  
      }     
      v = '__return';
      deps = s.vars;
      //hack the last return format
      var nr = {};
      nr.type = 'assign';
      nr.left = {
        type : 'var',
        name : '__return',
        members : []
      }
      nr.right = s.stmt.expr;

      stmts[i].stmt = nr;

    } 

    o = {
      'var' : v,
      'deps': deps
    }
    nodes.push(o);
  }

  //debug('nodes');
  //inspect(nodes);
  //inspect(stmts);
  //do orders
  var ok;
  var sts  = {};
  var seqs = [];
  var arr  = []; 
  for (i = 0; i < nodes.length;) {
    o = nodes[i];
    deps = o.deps;
    ok = true;
    for (j = 0; j < deps.length; j++) {
      if (sts[deps[j]] != true) {
        ok = false;
        break;
      }
    }
    //debug('i : ' + i + ', ok :' + ok);
    if (ok) {
      arr.push(stmts[i].stmt);
      i++;
    } else {
      if (arr.length > 0) {
        seqs.push(arr);  
        for (j = 0; j < i; j++) {
          o = nodes[j];
          v = o['var']; 
          sts[v] = true;
        }
        arr = [];
      } else {
        throw new Error('can\'t decide order for : ' + o['var']); 
      }
    }
  }

  if (arr.length > 0) {
    seqs.push(arr);
  }

  return seqs;
}
