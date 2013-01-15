var Parser            = require('./parser');
var AstHelper         = require('./ast_helper');
var doWhereFilter     = require('./where');
var doColumnSelect    = require('./column');
var doOrderby         = require('./orderby');
var doLimitFilter     = require('./limit');
var doDistinctFilter  = require('./distinct');
var doPreprocess      = require('./preprocess');
var doPostprocess     = require('./postprocess');

var AstReader     = AstHelper.Reader
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

function select(dc, ar) {
  if (dc.columns.length == 0) {
    //TODO, if select '*' and empty
    dc.columns = ar.getAsNames();
    inspect(dc.columns);
    return dc;
  }
  //debug('before preprocess');
  //inspect(dc);
  //inspect(ar);
  dc = doPreprocess(dc, ar);
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
  return dc;
}

function loadData(ast) {
  var rawData = { 
    columns: [ 'id', 'sex' ],
    data: [ 
      [ 3, 'f' ], 
      [ 4, 'f' ], 
      [ 6, 'f' ], 
      [ 8, 'f' ], 
      [ 10, 'f' ] 
    ] 
  };
  return rawData;
}

exports.runSQL = function (str, cb) {
  var ast;
  try {
    ast = Parser.parse(str);
  } catch (e) {
    cb(e)
    return; 
  }
  runAST(ast, cb);
}

exports.runAST = runAST; 

function runAST(ast, cb) {
  //inspect(ast);
  var ar = new AstReader(ast);
  load(ar, function(err, dc){
    if (err) {
      cb(err);
    } else {
      try {
        dc = doDataFilter(dc, ar);  
      } catch (e) {
        cb(e);
        return;
      }
      cb(null, dc);
    }
  });
}

exports.doDataFilter = doDataFilter;
function doDataFilter(dc, ar) {
  var type = ar.getType();
  switch (type) {
    case 'select' :
      dc = select(dc, ar);
      break;
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
