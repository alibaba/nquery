
/**
 * @param {Object} dc like :{
 *   columns : ['col1', 'col2'],
 *   data : [
 *    ['a', 'b', 'c'],
 *    ['b', 'c', 'd']
 *   ]
 * }
 */

module.exports  = function (dc){
  dc.data = distinct(dc.data);
  return dc;
}

function distinct(data){
  var res = [];
  var map = {};
  for(var i = 0; i < data.length; i++){
    var cols = data[i];
    var key = [];
    for(var j = 0; j < cols.length; j++){
      var c = cols[j];
      key.push((typeof c ) + c);
    }
    key = key.join('_');

    if(map[key] === undefined){
      map[key] = true;
      res.push(cols);
    } 
  }
  return res;
}

function debug(str){
  console.log(str);
}

function inspect(obj){
  console.log(require('util').inspect(obj));
}
