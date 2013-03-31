// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

module.exports = filter; 
/** @param {Array} limit  [2,0] or []
    [count, offset]
 */
function filter(dc, limits){
  var beg = limits[0];
  var end = beg + limits[1];
  
  var dData = dc.data;
  var rData = dData.slice(beg, end);
  return {
    columns : dc.columns,
    data : rData
  }
}
