// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Context  = require('./context');

exports.leftJoin  = leftJoin;
exports.innerJoin = innerJoin;

function debug(str){
  //console.log(str);
}

function inspect(obj){
  //console.log(require('util').inspect(obj, false, 10));
}

function leftJoin(ta ,tb, on){
  var ka = on.left;
  var kb = on.right;
  
  var klen = kb.length;
  var i, j, k;

  //hash b like that:
  // kb1 : [ele1, ele2]
  // kb2 : [el3, ele5];
  var adata = ta.data;
  var bdata = tb.data;
  var tblen = bdata.length;
  var talen = adata.length;
  
  var ele;
  var aele;
  var bele;
  var key;
  var hba;

  var tbCol, found;
  var apos = [];
  var acols = ta.columns;
  for (i = 0; i < klen; i++) {
    for (j = 0; j < acols.length; j++){
      found = false;
      for (k = 0; k < acols[j].length; k++) {
        tbCol = acols[j][k];
        if (tbCol.table == ka[i].table && tbCol.column == ka[i].column) {
          apos.push(j)
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }


  var bpos = [];
  var bcols = tb.columns;
  for (i = 0; i < klen; i++) {
    for (j = 0; j < bcols.length; j++) {
      found = false;
      for (k = 0; k < bcols[j].length; k++) {
        tbCol = bcols[j][k];
        if (tbCol.table == kb[i].table && tbCol.column == kb[i].column) {
          bpos.push(j)
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  //debug(bcols :" + bcols);
  //debug("bpos :" + bpos);

  var rcols = [].concat(acols);
  for (i = 0; i < apos.length; i++) {
    rcols[apos[i]] = rcols[apos[i]].concat(bcols[bpos[i]]);
  }

  var diffpos = [];
  for (i = 0; i < bcols.length; i++) {
    if (bpos.indexOf(i) < 0) {
      rcols.push(bcols[i]);
      diffpos.push(i);
    }
  }
  var difflen = diffpos.length;

  //debug("rcols :" + rcols);
  //debug("diffpos :" + diffpos);

  var dummyhb = [];
  for (i = 0; i < bcols.length; i++){
    dummyhb.push(null);
  }
  dummyhb = [dummyhb];

  ka = apos;
  kb = bpos;
  
  var hb = {};
  for (i = 0; i < tblen; i++) {
    bele = bdata[i];
    key = "";
    for (j = 0; j < klen; j++) {
      key += bele[kb[j]];
      key += ",";
    }
    if (hb[key] == null) hb[key] = [];
    hb[key].push(bele);
    //debug("bhash index :" + bid);
  }

  //result data
  var rdata = [];

  for (i = 0; i < talen; i++) {
    aele = adata[i];
    //get the related b elements array
    key = "";
    for (j = 0; j < klen; j++) {
      key += aele[ka[j]]; 
      key += ","
    }
    //debug("ta.index : " + key);
    hba = hb[key];
    //inspect(hba);
    if(hba == null) hba = dummyhb;
    //else bingo++;
    for (j = 0; j < hba.length; j++) {
      ele = [].concat(aele);    
      //ele = (aele);    
      bele = hba[j];
      for (k = 0; k < difflen; k++) {
        ele.push(bele[diffpos[k]]);
      }
      rdata.push(ele);
    }
  }
  return {
    columns : rcols,
    data    : rdata
  };
}

function innerJoin(ta ,tb, on){
  var ka = on.left;
  var kb = on.right;
  
  var klen = kb.length;
  var i, j, k;

  //hash b like that:
  // kb1 : [ele1, ele2]
  // kb2 : [el3, ele5];
  var adata = ta.data;
  var bdata = tb.data;
  var tblen = bdata.length;
  var talen = adata.length;
  
  var ele;
  var aele;
  var bele;
  var key;
  var hba;

  var tbCol, found;

  var apos = [];
  var acols = ta.columns;
  for (i = 0; i < klen; i++) {
    for (j = 0; j < acols.length; j++){
      found = false;
      for (k = 0; k < acols[j].length; k++) {
        tbCol = acols[j][k];
        if (tbCol.table == ka[i].table && tbCol.column == ka[i].column) {
          apos.push(j)
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  var bpos = [];
  var bcols = tb.columns;
  for (i = 0; i < klen; i++) {
    for (j = 0; j < bcols.length; j++) {
      found = false;
      for (k = 0; k < bcols[j].length; k++) {
        tbCol = bcols[j][k];
        if (tbCol.table == kb[i].table && tbCol.column == kb[i].column) {
          bpos.push(j)
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }
  //console.log("bcols :" + bcols);
  //console.log("bpos :" + bpos);

  //concat the join keys
  var rcols = [].concat(acols);
  for (i = 0; i < apos.length; i++) {
    rcols[apos[i]] = rcols[apos[i]].concat(bcols[bpos[i]]);
  }

  var diffpos = [];
  for (i = 0; i < bcols.length; i++) {
    if (bpos.indexOf(i) < 0) {
      rcols.push(bcols[i]);
      diffpos.push(i);
    }
  }
  var difflen = diffpos.length;

  //debug("rcols :" + rcols);
  //debug("diffpos :" + diffpos);
  ka = apos;
  kb = bpos;
  
  var hb = {};
  for (i = 0; i < tblen; i++) {
    bele = bdata[i];
    key = "";
    for (j = 0; j < klen; j++){
      key += bele[kb[j]];
      key += ",";
    }
    if (hb[key] == null) hb[key] = [];
    hb[key].push(bele);
    //debug("bhash index :" + bid);
  }

  //result data
  var rdata = [];

  for (i = 0; i < talen; i++) {
    aele = adata[i];
    //get the related b elements array
    key = "";
    for (j = 0; j < klen; j++) {
      key += aele[ka[j]]; 
      key += ","
    }
    //debug("ta.index : " + key);
    hba = hb[key];
    if (hba) {
      for (j = 0; j < hba.length; j++) {
        bele = hba[j];
        ele = [].concat(aele); 
        for (k = 0; k < difflen; k++) {
          ele.push(bele[diffpos[k]]);
        }
        rdata.push(ele);
      }
    }
  }
  return {
    columns : rcols,
    data    : rdata
  };
}

