var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('template test',function(){
  it('basic test', function(){
    var sql, ast;

    sql = 'select ( a NOT CONTAINS (:id, 1) AND c = :name)';
    ast = Parser.tplParse(sql, {
        id : [1, 2,3],
        name  : [true, null, 'str']
      });

    //inspect(east);
    ast.should.eql({
        type: 'select',
        distinct: '',
        columns: [ 
          { 
            expr: { 
              type: 'binary_expr',
              operator: 'AND',
              left: { 
                type: 'binary_expr',
                operator: 'NOT CONTAINS',
                left: { 
                  type: 'column_ref',
                  table: '',
                  column: 'a'
                },
                right:{ 
                  type: 'expr_list',
                  value: [ 
                    { type: 'number', value: 1 },
                    { type: 'number', value: 1 },
                    { type: 'number', value: 2 },
                    { type: 'number', value: 3 } 
                  ] 
                } 
              },
              right: { 
                type: 'binary_expr',
                operator: '=',
                left: { 
                  type: 'column_ref',
                  table: '',
                  column: 'c' 
                },
                right: { 
                  type: 'expr_list',
                  value: [ 
                    { type: 'bool', value: true },
                    { type: 'null', value: null },
                    { type: 'string', value: 'str' } 
                  ] 
                } 
              },
              paren: true 
            },
            as: '' 
          } 
        ],
        from: '',
        where: '',
        groupby: '',
        orderby: '',
        limit: '' 
    });

    sql = 'select ( a NOT CONTAINS (:id, 1) AND c = :name)';
    ast = Parser.tplParse(sql, {
        id : [10, 9, 8],
        name  : ['hello', 'world']
      });

    //inspect(east);
    ast.columns.should.eql([ 
      { 
        expr:  { 
          type: 'binary_expr',
          operator: 'AND',
          left: { 
            type: 'binary_expr',
            operator: 'NOT CONTAINS',
            left: {
              type: 'column_ref',
              table: '',
              column: 'a' 
            },
            right: {
              type: 'expr_list',
              value: [ 
                { type: 'number', value: 1 },
                { type: 'number', value: 10 },
                { type: 'number', value: 9 },
                { type: 'number', value: 8 } 
              ] 
            } 
          },
          right: { 
            type: 'binary_expr',
            operator: '=',
            left: { 
              type: 'column_ref',
              table: '',
              column: 'c' 
            },
            right:  { 
              type: 'expr_list',
              value:  [ 
                { type: 'string', value: 'hello' },
                { type: 'string', value: 'world' } 
              ] 
            } 
          },
          paren: true 
        },
        as: '' 
      } 
    ]);

  })

  it('limit template ', function(){
    var sql, ast;
    sql = 'select 1 from a limit 1, :lm';
    ast = Parser.tplParse(sql, {lm : 5});
    //inspect(east);
    ast.limit.should.eql([ 
      { type: 'number', value: 1 },
      { type: 'number', value: 5 } 
    ]);
  })

  it('contains test', function(){
    var sql, ast;
    sql = 'select * from a  where p not contains(:p)';
    ast = Parser.tplParse(sql, {p : 'a'});
    //inspect(ast.where);

    ast.where.should.eql( {
      type: 'binary_expr',
      operator : 'NOT CONTAINS',
      left     : {type : 'column_ref', table : '', column : 'p'},
      right    : {
        type : 'expr_list',
        value : [
          {type :'string', value : 'a'}
        ]
      }
    });
  })

  it('between test', function(){
    var sql, ast;
    sql = "select * from a  where p between :begin and :end";
    ast = Parser.tplParse(sql, {begin : 'b', end : 'c'});
    //inspect(ast.where);
    ast.where.should.eql( {
      type: 'binary_expr',
      operator : 'BETWEEN',
      left     : {type : 'column_ref', table : '', column : 'p'},
      right    :  {
        type : 'expr_list',
        value : [
          {type :'string', value : 'b'},
          {type :'string', value : 'c'}
        ]
      }
    });
  });

  it('error test', function(){
    var sql, ast;
    sql = 'select (a in (1) And b NOT CONTAINS (:id, 1))';
    try{
      ast = Parser.tplParse(sql, {name : 'hello'});
    } catch(e) {
      e.message.should.include('not instantiated :id');
    }
  })

  it('update template ', function(){
    var sql, ast;
    sql = 'UPDATE hbase_test.seller_meta SET cf1:name=:name, cf1:selected_cid=:selected_cid, cf1:foo=:foo, cf1:date=:date, cf1:updated_at=:updated_at, cf1:bool1=:bool1, cf1:bool2=:bool2 WHERE row = :row';

    var data = {
      "name":"你好abc",
      "selected_cid":1111,
      "foo":"33120600",
      "date":"2012-12-27T07:20:11.074Z",
      "updated_at":"2012-10-10 12:23:33",
      "bool1":true,
      "bool2":false,
      "row":"320722549d1751cf3f247855f937b982"
    }
    ast = Parser.tplParse(sql, data);
    //inspect(east);
    ast.set.should.eql([ 
      { 
        column: 'cf1:name',
        value: { type: 'string', value: '你好abc' } 
      },
      { 
        column: 'cf1:selected_cid',
        value: { type: 'number', value: 1111 } 
      },
      { 
        column: 'cf1:foo',
        value: { type: 'string', value: '33120600' } 
      },
      { 
        column: 'cf1:date',
        value: { type: 'string', value: '2012-12-27T07:20:11.074Z' } 
      },
      { 
        column: 'cf1:updated_at',
        value:{ type: 'string', value: '2012-10-10 12:23:33' } 
      },
      { 
        column: 'cf1:bool1',
        value: { type: 'bool', value: true } 
      },
      { 
        column: 'cf1:bool2',
        value: { type: 'bool', value: false } 
      } 
    ]);
  })

  it('insert template ', function(){
    var sql, ast;
    sql = "INSERT INTO v2 (agentpos,priority) values (:agentpos,:priority)";
    var data = {
      agentpos: 499588979,
      priority: 100
    }

    ast = Parser.tplParse(sql, data);
    ast.values.should.eql([{ 
      type: 'expr_list',
      value: [ 
        { type: 'number', value: 499588979 },
        { type: 'number', value: 100 } 
      ] 
    }])

    //do it again
    ast = Parser.tplParse(sql, data);
    inspect(ast);
    ast.values.should.eql([{ 
      type: 'expr_list',
      value: [ 
        { type: 'number', value: 499588979 },
        { type: 'number', value: 100 } 
      ] 
    }])
  })

})

