
module.exports = filter; 
/** @param {Array} limit  [2,0] or []
    [count, offset]
 */
function filter(dc, limits){
  var beg = limits[0];
  var end = beg + limits[1];
  
  var dData = dc.data;
  var rData = dData.slice(beg, end);
  return {
    columns : dc.columns,
    data : rData
  }
}
