var Table     = require('./table');

var leftJoin  = require('../base/join').leftJoin;
var innerJoin = require('../base/join').innerJoin;

function debug(str) {
  //console.log(str);
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10));  
}

exports.join = function (ltb, rtb, op, ons ) {
  //debug('ons:')
  //inspect(ons);
  //debug('ops:')
  //inspect(op);
  var fn = leftJoin;
  if (!op || op == '' || op == 'JOIN' || op == 'INNER JOIN'){
    fn = innerJoin;
  }
  //inspect(onParam);
  var table = fn(ltb, rtb, ons);
  return table;
}

exports.union = function(dArr) {
  if (dArr.length == 1) {
    return dArr[0];
  }

  var lCols = [];
  for(var i = 0; i < dArr.length; i++){
    lCols = dArr[i].getColNames();
    if(lCols.length > 0) break;
  }
  var cols = [].concat(lCols);
  var data = [];
  for(var i = 0; i < dArr.length; i++){
    var cData = dArr[i].getRows();
    data = data.concat(cData);
  }

  return new Table({
    columns : cols,
    data : data
  });
}
