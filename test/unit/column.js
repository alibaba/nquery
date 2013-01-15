var should = require('should');

var Parser = require('../../lib/parser');
var AstHelper = require('../../lib/ast_helper');
var createBinaryExpr = AstHelper.createBinaryExpr;

var filter = require('../../base/column');

var AstReader = AstHelper.Reader;

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('column filter test', function(){
  it('column simple select', function(){
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

    var idSel = {type : 'column_ref', table : 'a', column : 'id'};
    var typeSel = {type : 'column_ref', table : 'b', column : 'type'};
    //sm.where('a.id',WHERE.EQ, 3);
    //inspect(e);
    var e = {
      columns : [
        {expr : idSel, as : ''},
        {expr : typeSel, as : ''}
      ]  
    }

    var res = filter(rawData, e.columns); 
    res.data.should.eql([
      [ 1, 't1' ], 
      [ 2, 't2' ], 
      [ 2, 't3' ], 
      [ 3, 't3' ], 
      [ 3, 't4' ], 
      [ 5, 't3' ], 
      [ 6, 't4' ] 
    ]);
  });
  
  /*
  it('error ', function(){
    var rawData = { 
      columns: [
        ['a.id', 'b.id'],
        ['a.name'],
        ['b.type']
      ],
      data: [ 
        [ 1, 'a', 't1' ] 
      ]
    };
    var e = createBinaryExpr('=', {type : 'column_ref', column : 'id'}, 3);
    //sm.where('a.id',WHERE.EQ, 3);
    //inspect(e);
    try{
      var res = filter(rawData, e); 
    }catch(e) {
      e.message.should.include('no column found for :id');    
    }
    should.not.exist(res);
  });
  */

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
    e = {
      columns: '*'  
    };

    res = filter(rawData, e.columns); 
    res.should.eql(rawData);
  });

  it('alias select ', function(){
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
    var idSel = {type : 'column_ref', column : 'id', table :  'a'};
    var typeSel = {type : 'column_ref', column : 'type', table : 'b'};
    //sm.where('a.id',WHERE.EQ, 3);
    //inspect(e);
    var e = {
      columns : [
        {expr : idSel, as : 'aaid'},
        {expr : typeSel, as : ''}
      ]  
    }
    var res = filter(rawData, e.columns); 
    res.columns.should.eql([
        [{table : 'a', column : 'id'}, {table : '', column : 'aaid'}],
        [{table : 'b', column : 'type'}]
    ]);
  });


  it('calculation select ', function(){
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
    e = {
      columns: [
        {
          expr : {
            type : 'binary_expr',
            operator : '+',
            left : {
              type    : 'column_ref',
              column  : 'id',
              table   : 'a'
            },
            right : {
              type : 'number',
              value : 5
            }
          },
          as : ''
        }
      ]  
    };
    res = filter(rawData, e.columns); 
    res.data.should.eql([
      [ 6 ], 
      [ 7] 
    ])
    
  });

  it('complicated calculation select ', function(){
    var rawData = { 
      columns: [
        [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
        [{table : 'a', column : 'name'}],
        [{table : 'b', column : 'type'}]
      ],
      data: [ 
        [ 1, 'a', 5 ], 
        [ 2, 'a', 6 ] 
      ]
    };
    var e, res;
    e = {
      columns: [
        {
          expr : {
            type : 'binary_expr',
            operator : '+',
            left : {
              type    : 'column_ref',
              column  : 'id',
              table   : 'a'
            },
            right : {
              type    : 'column_ref',
              column  : 'type',
              table   : 'b'
            }
          },
          as : 'id_type_add'
        }
      ]  
    };
    res = filter(rawData, e.columns); 
    res.should.eql({
      columns : [
        [{table : '', column : 'a.id + b.type'}, {table : '', column : 'id_type_add'}] 
      ],
      data : [
        [ 6 ], 
        [ 8] 
      ]
    });
    
  });
});
