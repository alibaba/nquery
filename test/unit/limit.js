
var should = require('should');
var doLimitFilter = require('../../base/limit');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('orderby  test', function(){

  it('basic test', function() {
    var rawData = { 
      columns: [ ['id'], ['sex'] ],
      data: [ 
        [ 3, 'a' ], 
        [ 4, 'f' ], 
        [ 4, 'b' ], 
        [ 8, 'f' ], 
        [ 10, 'c' ] 
      ] 
    };
    var ed = doLimitFilter(rawData, [1, 2]);
    //inspect(ed);
    ed.data.should.eql([ 
      [ 4, 'f' ], 
      [ 4, 'b' ] 
    ]);
  });

});
