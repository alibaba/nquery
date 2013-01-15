
var AstHelper = require('./ast_helper');

function debug(str){
  console.log(str);
}

function inspect(obj){
  console.log(require("util").inspect(obj, false, 10));
}

module.exports = orderby;
/** 
 * @param {Array} orderby  [{name : 'col1' , type : "ASC"}, ...]
 */
function orderby(dc, orderby) {
  var cPos = []; 
  var dCols = dc.columns;
  var dData = dc.data;
  var pos;
  for (var i = 0; i < orderby.length ; i++) {
    pos = AstHelper.getRowPosByCol(dCols, orderby[i].name);
    cPos.push(pos);
  }
  //debug('orderby pos');
  //inspect(cPos);
  var rData = dData.sort(function(a, b){
    var cmp = 0;
    for(var i = 0; i < cPos.length; i++){
      var pos = cPos[i];
      if (a[pos] != b[pos]) {
        if (a[pos] > b[pos]) {
          cmp = 1; 
        } else {
          cmp = -1;
        }
        if(orderby[i].type == 'DESC') cmp = -cmp;
        break;
      }
    }
    return cmp;
  });

  return {
    columns : dCols,
    data : rData
  }
}
