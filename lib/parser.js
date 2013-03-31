// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Parser = require('../base/nquery');
var MCache = require('../base/mcache');

var clone   = require('./tool').clone;

function debug(str) {
  //console.log(str);  
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

exports.parse = function (sql){
  var ap = Parser.parse(sql);
  return ap.ast;
}

var cache = new MCache(1000);

exports.tplParse = function (sql, data){
  if (!data || typeof(data) != 'object') {
    data = {};
  }
  //get cache first
  var ap, ast, tpls;
  if (Object.keys(data).length > 0) {
    //debug('try get cache');
    ap = cache.get(sql);  
  } 
  if (!ap) {
    ap = Parser.parse(sql);
    tpls = ap.param;
    if (tpls.length > 0) {
      //debug('set for : ' + sql);
      cache.set(sql, ap);  
    }
  } else {
    tpls = ap.param;  
  }
  ast = ap.ast;
  //the params were associated with the ast objeect
  //only set when there are params
  if (tpls.length > 0) {
    inspect(ast);
    inspect(tpls);
    inspect(data);
    ast = linkAstData(ast, tpls, data);
  } 
  return ast;
}

function linkAstData(ast, tpls, data) {
  var i, bpl, tpl, value;
  var backup = [];
  for (i = 0; i < tpls.length; i++) {
    tpl = tpls[i];
    value = data[tpl.value];

    if (value === undefined) {
      throw new Error('the template element not instantiated :' + tpl.value);
    }
    //do backup first
    bpl = {};
    bpl.value = tpl.value;
    if (tpl.room) {
      bpl.room_value = clone(tpl.room.value);  
    }
    backup.push(bpl);
  }
  //we MUST seperate the two steps, for may two tpls use the same room
  for (i = 0; i < tpls.length; i++) {
    tpl = tpls[i];
    value = data[tpl.value];
    //debug('\ninstantiate :' + tpl.value);
    instantiateTpl(tpl, value)  
  }

  ast = clone(ast);  
  //debug('before restore ,the backup');
  //inspect(backup);
  //restore the point of tpl/ast
  for (i = 0; i < tpls.length; i++) {
    tpl = tpls[i];
    bpl = backup[i];

    tpl.type  = 'param';
    tpl.value = bpl.value;
    if (tpl.room) {
      tpl.room.value = bpl.room_value; 
    }
  }
  return ast;
}

function instantiateTpl(tpl, v) {
  var t = typeof v;
  if (Array.isArray(v)) {
    //TODO ,use maybe should support mixed 
    //type of array and literal values in param and set it at the speficfic position
    var list = [];
    if (tpl.room && Array.isArray(tpl.room.value)) {
      list = tpl.room.value;
    } else {
      tpl.type = 'expr_list';
      tpl.value = list;
    }
    for (var i = 0; i < v.length; i++) {
      var e = instantiateTpl({}, v[i]);
      list.push(e);
    }
  } else if(tpl.room && Array.isArray(tpl.room.value)) {
    tpl.room.value.push(instantiateTpl({}, v));
  } else if (t == 'string') {
    tpl.type = 'string';
    tpl.value = v;
  } else if (t == 'number') {
    tpl.type = 'number';
    tpl.value = v;
  } else if (t === 'boolean') {
    tpl.type = 'bool';
    tpl.value = v;
  } else if (v === null) {
    tpl.type = 'null',
    tpl.value = null
  } 
  return tpl;
}


