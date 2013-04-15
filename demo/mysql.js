// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var nQuery    = require('../index');

var Parser    = nQuery.Parser;
var Executor  = nQuery.Executor;
var AstReader = nQuery.AstReader;

var dc = {
  columns :  [
    'name' , 'type', 'shop_id', 'title', 'money'
  ],
  data  : [
    ['edward', 'a', 1, 'spring', 100],
    ['bob',    'b', 2, 'spring', 100],
    ['alice',  'b', 3, 'spring', 120],
    ['selly',  'b', 4, 'spring', 120],
    ['kikyou', 'c', 5, 'summer', 220],
    ['kobe',   'c', 6, 'summer', 320],
    ['onesa',  'd', 8, 'summer', 320],
    ['miller', 'd', 9, 'summer', 320]
  ]
}

exports.query = function(str, cb) {
  var dc;
  try {
    dc = run(str);
  } catch (e) {
    cb(e);
    return;
  }
  cb(null, dc);
}

var doSelectFilter = Executor.doSelectFilter;

function run(str) {
  var ast = Parser.parse(str);
  var ar  = new AstReader(ast);

  var res = doSelectFilter(dc, ar);
  return res;
}
