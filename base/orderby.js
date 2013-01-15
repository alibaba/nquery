// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var AstHelper = require('../lib/ast_helper');

module.exports = orderby;

function debug(str){
  //console.log(str);
}

function inspect(obj){
  //console.log(require("util").inspect(obj, false, 10));
}

/** 
 * @param {Array} orderby  [{name : 'col1' , type : "ASC"}, ...]
 */
function orderby(dc, orderby) {
  var cPos = []; 
  var dCols = dc.columns;
  var dData = dc.data;
  var pos;
  for (var i = 0; i < orderby.length ; i++) {
    pos = AstHelper.getRowPosByCol(dCols, orderby[i].name);
    cPos.push(pos);
  }
  //debug('orderby pos');
  //inspect(cPos);
  var rData = dData.sort(function(a, b){
    var cmp = 0;
    for(var i = 0; i < cPos.length; i++){
      var pos = cPos[i];
      if (a[pos] != b[pos]) {
        if (a[pos] > b[pos]) {
          cmp = 1; 
        } else {
          cmp = -1;
        }
        if(orderby[i].type == 'DESC') cmp = -cmp;
        break;
      }
    }
    return cmp;
  });

  return {
    columns : dCols,
    data : rData
  }
}
