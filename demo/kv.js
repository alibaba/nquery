// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var columns = [
    'id', 'name' , 'type', 'age', 'gender'
  ];
 
var data = [
    ['00', 'alice', 'a', 18, 'male'   ],
    ['01', 'bob',   'b', 18, 'female' ],
    ['02', 'edward','a', 13, 'male'   ],
    ['03', 'selly', 'c', 18, 'female' ],
    ['04', 'miller','a', 12, 'male'   ],
    ['05', 'alice', 'd', 18, 'male'   ],
    ['06', 'edward','a', 12, 'female' ],
    ['07', 'alice', 'e', 18, 'male'   ],
    ['08', 'kenney','a', 12, 'female' ],
    ['09', 'kobe',  'e', 28, 'male'   ],
    ['10', 'kikyou','a', 12, 'female' ],
    ['11', 'onesa',  'e', 28, 'male'  ]
  ]; 

module.exports = {
  singleQuery : singleQuery,  
  rangeQuery  : rangeQuery,
  likeQuery   : likeQuery
}

function singleQuery(k) {
  var rows = data;
  var row;

  var ret = {
    columns : columns,
    data : []
  }
  for (var i = 0; i < rows.length; i++) {
    row = rows[i];
    if (row[0] == k) {
      ret.data.push(row);
      break;
    }
  }
  return ret;
} 

function rangeQuery(beg, end) {
  var rows = data;
  var row;

  var ret = {
    columns : columns,
    data : []
  }
  for (var i = 0; i < rows.length; i++) {
    row = rows[i];
    if (row[0] >= beg && row[0] < end) {
      ret.data.push(row);
    }
  }
  return ret;
} 

//begin with `str`
function likeQuery(str) {
  //console.log('likeQuery of :' + str);
  var rows = data;
  var row;

  var ret = {
    columns : columns,
    data : []
  }
  for (var i = 0; i < rows.length; i++) {
    row = rows[i];
    if (row[0].indexOf(str) == 0) {
      ret.data.push(row);
    }
  }
  return ret;
} 
