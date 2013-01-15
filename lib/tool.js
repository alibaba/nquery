// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

exports.clone =  clone;

function clone(obj) {
  var type = typeof(obj);
  if ('object' == type && null !== obj) {
    var res;
    if (Array.isArray(obj)) {
      res = [];
      for (var i =0, l = obj.length; i < l; i++) {
        res.push(clone(obj[i]));  
      }
    } else {
      res = {};
      var k, v;
      var keys = Object.keys(obj);
      for (var i =0, l = keys.length; i < l; i++) {
        k = keys[i];
        v = clone(obj[k])
        res[k] = v;
      }
    }
    return res;
  }
  return obj;
}
