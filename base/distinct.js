// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

/**
 * @param {Object} dc like :{
 *   columns : ['col1', 'col2'],
 *   data : [
 *    ['a', 'b', 'c'],
 *    ['b', 'c', 'd']
 *   ]
 * }
 */

module.exports  = function (dc){
  dc.data = distinct(dc.data);
  return dc;
}

function distinct(data){
  var res = [];
  var map = {};
  for(var i = 0; i < data.length; i++){
    var cols = data[i];
    var key = [];
    for(var j = 0; j < cols.length; j++){
      var c = cols[j];
      key.push((typeof c ) + c);
    }
    key = key.join('_');

    if(map[key] === undefined){
      map[key] = true;
      res.push(cols);
    } 
  }
  return res;
}

function debug(str){
  //console.log(str);
}

function inspect(obj){
  //console.log(require('util').inspect(obj));
}
