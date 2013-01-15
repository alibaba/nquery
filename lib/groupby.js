function debug(str){
  //console.log(str);
}

function inspect(obj){
  //console.log(require("util").inspect(obj, false, 10));
}

function genGbKey(args){
  var keys = [];
  for(var i = 0; i < args.length; i++){
    var c = args[i];
    keys.push((typeof c) + '_' +  c);
  }
  return keys.join('__');
}

module.exports = doGroupby;

function doGroupby(dc, gb) {
  var i, j;
  var columns = dc.columns;
  var data = dc.data;

  var gbPos = [];
  for(i = 0; i < gb.length; i++){
    var gCol = gb[i]
    for(j = 0; j < columns.length; j++){
      if(columns[j].indexOf(gCol) >= 0){
        gbPos[i] = j;
        break;
      }
    }
  }
  var res = {};
  for (i = 0; i < data.length; i++) {
    var gCols = [];
    var d = data[i];
    for (j = 0; j < gbPos.length; j++) {
      var p = gbPos[j]
      gCols.push(d[p]); 
    }
    var key = genGbKey(gCols);
    if (res[key] == null){
      res[key] = {
        columns : columns,
        data : []
      }
    }
    res[key].data.push(d);
  }

  return res;
}
