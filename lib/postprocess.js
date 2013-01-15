
module.exports = getFinalColName;

function getFinalColName(dc, sp){
  var cols  = dc.columns;
  var rows  = dc.data;
  var fcols = [];

  var tbAlias = sp.getTableAlias();
  for (var i = 0; i < cols.length; i++) {
    var col = cols[i].pop();
    //maybe there are undefined columns...
    if (col == null || col == '') {
      r.push(null);
      continue;
    }
    var dPos = col.indexOf('.');
    if (dPos > 0) {
      var tpre = col.substr(0, dPos);
      if (tpre == tbAlias) {
        col = col.substr(dPos + 1);
      }
    }
    fcols.push(col);
  }
  return {
    columns : fcols,
    data    : rows
  }
}
