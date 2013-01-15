// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

module.exports = Table;

function debug(str){
  //console.log(str);
}

function inspect(obj){
  //debug(require('util').inspect(obj, false, 10));
}

/**
 * @param {Object} obj could be like :
 * {
 *   columns : [
 *     f0 ,
 *     f1 ,
 *     f3 
 *   ],
 *   data : [
 *     ['a', 'b' , 'c'],
 *     ['b', 'd' , 'e'],
 *     ...
 *   ]
 * }
 * or format like that : 
 * [
 *   {f0 : 'a',  f1 : 'b', f2 : 'c'},
 *   {f0 : 'b',  f1 : 'd', f2 : 'e'},
 *   ...
 * ]
 *
 * @param {String} alias, the table alias, if not null ,
 * we will use this as the column prefix
 */
function Table(obj) {
  this._colNames = [];
  this._rows = [];

  if (obj != null) {
    if (Array.isArray(obj)) {
      var cols = [];
      var data = [];
      var i, o, row, col;
      for (i = 0; i < obj.length; i++) {
        o = obj[i];
        row = [];
        for (col in o) {
          //init columns;
          if (i == 0) {
            cols.push(col);
          }
          row.push(o[col]); 
        }
        data.push(row);
      }
      this._colNames = cols;
      this._rows = data;
    } else if (Array.isArray(obj.columns) && Array.isArray(obj.data)) {
      //if we think the columns are already 2d
      this._colNames = obj.columns;
      this._rows = obj.data;
    }
  }
}

Table.prototype.getColumn = function(col){
  var res = [];
  var rows = this._rows;
  var rLen = rows.length;
  var pos = this._colNames.indexOf(col);
  if (pos >= 0) {
    for(var i = 0; i < rLen; i++){
      res.push(rows[i][pos]);
    }
  } else if(rLen > 0) {
    throw new Error('no column found for : ' + col);
  }
  return res;
}

Table.prototype.getColNames = function(){
  return this._colNames;
}

Table.prototype.setColNames = function(arr){
  this._colNames = arr;
}

Table.prototype.getRows = function(){
  return this._rows;
}

Table.prototype.get = function(table, alias){
  var cols = this._colNames;
  var cs, cname;
  var fcols = [];
  for (var i = 0; i < cols.length; i++) {
    cname = cols[i];
    cs = [];
    cs.push({
      table : table,
      column: cname
    })
    if (alias || alias === '' ) {
      cs.push({
        table : alias,
        column: cname
      })
    }
    fcols.push(cs);
  }
  return {
    columns : fcols,
    data    : this._rows
  };
}

//only be called once,for it will pop the colNames
Table.prototype.getData = function(){
  return {
    __nsql_type__ : 'table',
    columns       : this._colNames,
    data          : this._rows
  };
}

Table.prototype.setRowData = function(d){
  this._rows = d;
}

