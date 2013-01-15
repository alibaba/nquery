// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Table   = require('./table');

exports.getBindVar = getBindVar;

var env = {};
exports.setctx = function(obj) {
  env = obj || {};
}

function getBindVar(expr, ctx) {
  ctx = ctx || env;
  var varid   = expr.name;
  var members = expr.members;

  var obj = ctx[varid];
  var index;
  for(var i = 0; i < members.length; i++) {
    index = members[i];
    if (obj instanceof Table) {
      obj = obj.getColumn(index);  
    } else {
      obj = obj[index];  
    }
  }
  return obj;
}
