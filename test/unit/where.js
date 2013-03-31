var should = require('should');

var Parser = require('../../lib/parser');
var AstHelper = require('../../lib/ast_helper');
var createBinaryExpr = AstHelper.createBinaryExpr;

var filter = require('../../base/where');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('where filter test', function(){
  it('column eql test', function(){
    var rawData = { 
      columns: [
        [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
        [{table : 'a', column : 'name'}],
        [{table : 'b', column : 'type'}]
      ],
      data: [ 
        [ 1, 'a', 't1' ], 
        [ 2, 'b', 't2' ], 
        [ 2, 'b', 't3' ], 
        [ 3, 'c', 't3' ], 
        [ 3, 'c', 't4' ], 
        [ 5, 'b', 't3' ], 
        [ 6, 'b', 't4' ] 
      ] 
    };
    var e = createBinaryExpr('=', {type : 'column_ref', column : 'id'}, 3);
    //sm.where('a.id',WHERE.EQ, 3);
    //inspect(e);
    var res = filter(rawData, e); 
    res.data.should.eql([
      [ 3, 'c', 't3' ], 
      [ 3, 'c', 't4' ] 
    ]);
  });
  
  it('error ', function(){
    var rawData = { 
      columns: [
        [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
        [{table : 'a', column : 'name'}],
        [{table : 'b', column : 'type'}]
      ],
      data: [ 
        [ 1, 'a', 't1' ] 
      ]
    };
    var e = createBinaryExpr('=', {type : 'column_ref', column : 'nid'}, 3);
    //sm.where('a.id',WHERE.EQ, 3);
    //inspect(e);
    try{
      var res = filter(rawData, e); 
    }catch(e) {
      e.message.should.include('no column found for :nid');    
    }
    should.not.exist(res);
  });

  it('all scan ', function(){
    var rawData = { 
      columns: [
        [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
        [{table : 'a', column : 'name'}],
        [{table : 'b', column : 'type'}]
      ],
      data: [ 
        [ 1, 'a', 't1' ], 
        [ 2, 'a', 't1' ] 
      ]
    };
    var e, res;
    e = createBinaryExpr('=', 1, 3);
    res = filter(rawData, e); 
    res.data.should.eql([]);

    e = createBinaryExpr('=', 1, 1);
    res = filter(rawData, e); 
    res.data.should.eql([
        [ 1, 'a', 't1' ], 
        [ 2, 'a', 't1' ] 
    ]);

    e = {type : 'bool', value : true};
    res = filter(rawData, e); 
    res.data.should.eql([
        [ 1, 'a', 't1' ], 
        [ 2, 'a', 't1' ] 
    ]);
  });
});
