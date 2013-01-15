
module.exports = extendColName;

function debug(str) {
  //console.log(str);  
}
//do colname expansion
function extendColName(dc, sp) {
  var cols = dc.columns || [];
  var rows = dc.data;
  var fcols = [];
  var tbAlias = sp.getTableAlias();
  var tbOrig  = sp.getTableOrig();
  //debug('alias :' + tbAlias);

  for (var i = 0; i < cols.length; i++) {
    if (Array.isArray(cols[i])) {
      fcols.push(cols[i]);
    } else {
      var arr = [];
      arr.push(cols[i]);
      if (tbOrig && tbOrig != '') {
        arr.push(tbOrig +  '.' + cols[i]);
      }
      if (tbAlias && tbAlias != '') {
        arr.push(tbAlias + '.' + cols[i]); 
      }
      fcols.push(arr);
    }
  }
  return {
    columns : fcols,
    data    : rows
  }
}

