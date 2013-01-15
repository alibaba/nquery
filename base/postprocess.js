// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

module.exports = getFinalColName;

function getFinalColName(dc, sp){
  var cols  = dc.columns;
  var rows  = dc.data;
  var fcols = [];

  var col;
  for (var i = 0; i < cols.length; i++) {
    col = cols[i].pop();
    fcols.push(col.column);
    //push it again ,don't change the data,only copy
    cols[i].push(col);
  }

  return {
    columns : fcols,
    data    : rows
  }
}
