// (C) 2011-2012 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

module.exports = extendColName;

function debug(str) {
  //console.log(str);  
}
//do colname expansion
function extendColName(dc, sp) {
  var colNames = dc.columns || [];
  var fcols = [];
  var tbAlias = sp.getTableAlias();
  var tbOrig  = sp.getTableOrig();
  var c, cols;
  //debug('alias :' + tbAlias);
  var i, j, tcs;
  for (i = 0; i < colNames.length; i++) {
    cols = colNames[i];
    tcs = [];
    if (Array.isArray(cols)) {
      for (j = 0; j < cols.length; j++) {
        c = cols[j]
        if (typeof c == 'object') {
          tcs.push(c);
        } else if (typeof c == 'string') {
          tcs.push({
            table : tbAlias,
            column: c
          });
          tcs.push({
            table : tbOrig,
            column: c
          });
        }
      }
    } else if (typeof cols == 'string') {
      tcs.push({
        table : tbAlias,
        column: cols
      })
      tcs.push({
        table : tbOrig,
        column: cols
      })
    }

    fcols.push(tcs);
  }
  return {
    columns : fcols,
    data    : dc.data
  }
}

