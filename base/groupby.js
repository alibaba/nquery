// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>


var AstHelper     = require('../lib/ast_helper');

module.exports = doGroupby;

function debug(str){
  //console.log(str);
}

function inspect(obj){
  //console.log(require("util").inspect(obj, false, 10));
}

var getRefColPos  = AstHelper.getRefColPos;

function genGbKey(args){
  var keys = [];
  for(var i = 0; i < args.length; i++){
    var c = args[i];
    keys.push((typeof c) + '_' +  c);
  }
  return keys.join('__');
}

function doGroupby(dc, gb) {
  var i, j;
  var columns = dc.columns;
  var data = dc.data;

  var gbPos = [];
  gbPos = getRefColPos(gb, columns);

  var res = {};
  for (i = 0; i < data.length; i++) {
    var gCols = [];
    var d = data[i];
    for (j = 0; j < gbPos.length; j++) {
      var p = gbPos[j]
      gCols.push(d[p]); 
    }
    var key = genGbKey(gCols);
    if (res[key] == null){
      res[key] = {
        columns : columns,
        data : []
      }
    }
    res[key].data.push(d);
  }
  return res;
}
