// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var doWhereFilter     = require('../base/where');
var doColumnSelect    = require('../base/column');
var doOrderby         = require('../base/orderby');
var doLimitFilter     = require('../base/limit');
var doDistinctFilter  = require('../base/distinct');
var doPostprocess     = require('../base/postprocess');

var Table             = require('./table');
var Context           = require('./context');
var AstHelper         = require('./ast_helper');

var AstReader     = AstHelper.Reader;
var expandSelect  = AstHelper.expandSelect;
var shrinkSelect  = AstHelper.shrinkSelect;

function debug(str) {
  //console.log(str);  
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

var load = loadData;
exports.setLoader = function(fn) {
  load = fn;
}

function loadData(ast, env, cb) {
  var rawData = { 
    columns: [ 'hello', 'nQuery' ],
    data: [ 
      [ 
        'hi, dear', 
        'you should add your own data sources...'
      ] 
    ] 
  };
  cb(null, rawData);
}

function select(dc, ar) {
  if (dc.columns.length == 0) {
    //TODO, if select '*' and empty
    //inspect(dc.columns);
    return {
      columns : ar.getAsNames(), 
      data : dc.data
    }
  }
  //debug('do Select now');
  //debug('before preprocess');
  //inspect(dc);
  //inspect(ar);
  //dc = doPreprocess(dc, ar);
  //adjustSelectAst(ast);
  //debug('after preprocess')
  //inspect(dc);

  var ast = ar.getAst();
  var where = ast.where;
  if (where && where != '') {
    dc = doWhereFilter(dc, where); 
  }

  var sels = ast.columns;
  if (sels != '*') {
    //do select-column expand
    var ob = ast.orderby;
    if (Array.isArray(ob) && ob.length > 0) {
      //debug('before expand:')
      //inspect(sels);
      sels = expandSelect(sels, ob);
      //debug('after expand:')
      //inspect(sels);
    }
  } 

  //debug('before column select');
  //inspect(dc);

  var gb = ar.getGroupby();
  //dc = doGroupbyFilter (dc, ast); 
  //data = doHavingFilter   (data, ast.having); 
  //do groupby, and column select
  dc = doColumnSelect(dc, sels, gb);

  //debug('before orderby');
  //inspect(dc);
  var orderby = ar.getOrderby();
  if (orderby.length > 0) {
    dc = doOrderby(dc, orderby); 
    //do select-column shrink
    //debug('before shrink, the columns');
    //inspect(ast.columns);
    if (sels != '*') {
      dc = shrinkSelect(dc, ast.columns);
    }
  }
 
  //debug('after orderby');
  //inspect(dc);

  if (ar.isDistinct()) {
    dc = doDistinctFilter(dc, ar);
  } 

  //debug('before limit');
  //inspect(dc);
  var limits = ar.getLimits();
  if (Array.isArray(limits) && limits.length == 2){
    dc = doLimitFilter(dc, limits); 
  } 

  dc = doPostprocess(dc, ar);
  //debug('select will return');
  //inspect(dc);
  return dc;
}

//NOTE the diffrence 
exports.doSelectFilter    = doSelectFilter;
exports.doSelectOnTable   = select;

function doSelectFilter(dc, ar) {
  var tbl = new Table(dc);
  var tbName  = ar.getTableOrig();
  var tbAlias = ar.getTableAlias();
  tbl = tbl.get(tbName, tbAlias);
  return select(tbl, ar);
}

function doPostFilter(dc, ar, ctx) {
  //set the global unique ctx
  Context.setctx(ctx);
  var type = ar.getType();
  switch (type) {
    case 'select' :
      dc = doSelectFilter(dc, ar);
      break;
    //TODO
    case 'update' :
      dc = update(ar);
      break;
    case 'insert'  :
    case 'replace' :
      dc = replace_insert(ar);
      break;
    default:
      throw new Error('not supported stmt :' + type);
      break;
  }  
  return dc;
}

exports.runAST = runAST; 

function runAST(ast, ctx, cb) {
  //inspect(ast);
  if (typeof(ctx) == 'function' && !cb) {
    cb = ctx;
    ctx = {};
  }

  var ar = new AstReader(ast);
  load(ar, ctx, function(err, dc, filter) {
    if (err) {
      cb(err);
    } else {
      //for sqldriver , filter maybe null,
      //for kv-type, the filter could be ar if you don't mask some key-column predicates
      if (filter) {
        try {
          dc = doPostFilter(dc, filter, ctx);  
        } catch (e) {
          cb(e);
          return;
        }
      }
      cb(null, dc);
    }
  });
}
