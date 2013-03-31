var should = require('should');

var Parser = require('../../lib/parser');
var Engine = require('../../lib/engine');
var AstHelper = require('../../lib/ast_helper');

var runExpr = Engine.run;
var createBinaryExpr = AstHelper.createBinaryExpr;

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('ast helper test', function(){
  
  it('get column ref', function(){
    var sql = 'select a from c where  a.c > 0 AND b != 2 AND d in (1, 2, 3) OR e like "hello"'; 

    var ast = Parser.parse(sql);
    var cols = AstHelper.getRefColumns(ast.where);
    // inspect(cols);
    cols.should.eql([ 
      { type: 'column_ref', table: 'a', column: 'c' },
      { type: 'column_ref',table: '',column: 'b' },
      { type: 'column_ref',table: '',column: 'd' },
      { type: 'column_ref',table: '',column: 'e' } 
    ]);
  })

  it('create binary expr', function(){
    var g = createBinaryExpr('>', {type : 'column_ref', value : 'a'}, 0);
    var e = createBinaryExpr('=', {type : 'column_ref', value : 'b'}, 0);
    //inspect(g);
    var a = createBinaryExpr('AND', g, e);
    a.should.eql({ 
      operator: 'AND',
      type: 'binary_expr',
      left:{ 
        operator: '>',
        type: 'binary_expr',
        left: { 
          type: 'column_ref', 
          value: 'a' 
        },
        right: { 
          type: 'number', 
          value: 0 
        } 
      },
      right:{
        operator: '=',
        type: 'binary_expr',
        left: { 
          type: 'column_ref', 
          value: 'b' 
        },
        right: { 
          type: 'number', 
          value: 0 
        } 
      } 
    });
  })

  it('arithmetic expr', function(){
    var e, r;
    e = createBinaryExpr('+', 1, 2);
    r = runExpr(e);
    r.should.eql(3);

    e = createBinaryExpr('-', 1, 2);
    r = runExpr(e);
    r.should.eql(-1);

    e = createBinaryExpr('*', 1.0, 5);
    r = runExpr(e);
    r.should.eql(5);

    e = createBinaryExpr('/', 5, 2);
    r = runExpr(e);
    r.should.eql(2.5);

    e = createBinaryExpr('%', 5, 3);
    r = runExpr(e);
    r.should.eql(2);
  });

  it('comparison expr', function(){
    var e, r;
    e = createBinaryExpr('>', 1, 0);
    r = runExpr(e);
    should.ok(r);

    e = createBinaryExpr('>=', 1, 0);
    r = runExpr(e);
    should.ok(r);

    e = createBinaryExpr('<', 1, 0);
    r = runExpr(e);
    r.should.eql(false);

    e = createBinaryExpr('<=', 1, 0);
    r = runExpr(e);
    r.should.eql(false);

    e = createBinaryExpr('!=', 1, 0);
    r = runExpr(e);
    should.ok(r);

    e = createBinaryExpr('=', 1, 0);
    r = runExpr(e);
    r.should.eql(false);

    e = createBinaryExpr('<>', 1, 0);
    r = runExpr(e);
    should.ok(r);

    e = createBinaryExpr('BETWEEN', 1, [0, 2]);
    r = runExpr(e);
    should.ok(r);

    e = createBinaryExpr('IS', 1, 0);
    r = runExpr(e);
    r.should.eql(false);

    e = createBinaryExpr('IN', 1, [0, 1, 2]);
    r = runExpr(e);
    should.ok(r);

    e = createBinaryExpr('NOT IN', 1, [0, 1, 2]);
    r = runExpr(e);
    r.should.eql(false);
  })

  it('unary expr', function(){
    var e, r;
    e = {
      type : 'unary_expr',
      operator : 'NOT',
      expr : createBinaryExpr('=', 1, 0)
    };
    r = runExpr(e);
    should.ok(r);
  })

  it('logic expr', function(){
    var e, r;
    e = createBinaryExpr('AND', true, true);
    r = runExpr(e);
    should.ok(r);

    e = createBinaryExpr('AND', false, true);
    r = runExpr(e); r.should.eql(false);

    e = createBinaryExpr('OR', false, true);
    r = runExpr(e);
    r.should.eql(true);

    e = createBinaryExpr('OR', false, true);
    r = runExpr(e);
    r.should.eql(true);

    e = createBinaryExpr('OR', false, false);
    r = runExpr(e);
    r.should.eql(false);
  })

  it('aggr function call ', function(){
    var e, r;
    e = {
      type : 'aggr_func',
      name : '',
      args : {
        expr : {
          value :[1,2, 3]
        }
      }
    }
    e.name = 'COUNT'
    r = runExpr(e);
    r.should.eql(3)

    e.name = 'SUM',
    r = runExpr(e);
    inspect(r);
    r.should.eql(6)

    e.name = 'AVG';
    r = runExpr(e);
    r.should.eql(2)

    e.name = 'MAX';
    r = runExpr(e);
    r.should.eql(3)

    e.name = 'MIN';
    r = runExpr(e);
    r.should.eql(1)
  })

  it('function call ', function(){
    var e, r;
    e = {
      type : 'function',
      name : '',
      args : [1,2, 3]
    }

    e.name = 'floor';
    e.args = {
      type  : 'expr_list',
      value : [
        {type : 'number', value : 1.5}
      ]
    }
    r = runExpr(e);
    r.should.eql(1)

    e.name = 'floor';
    e.args = [1.5];
    r = runExpr(e);
    r.should.eql(1)

    e.name = 'CEILING';
    e.args = [1.5];
    r = runExpr(e);
    r.should.eql(2);
  })
})
