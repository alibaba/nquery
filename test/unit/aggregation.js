var should = require('should');

var Parser = require('../../lib/parser');
var AstHelper = require('../../lib/ast_helper');
var createBinaryExpr = AstHelper.createBinaryExpr;

var filter = require('../../base/aggregation');

var AstReader = AstHelper.Reader;

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('aggregation test', function(){
  it('basic test', function(){
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

    var str; 
    var ast;
    var res;

    str = "select SUM(a.id) from data";
    ast = Parser.parse(str);
    //inspect(ast.columns);
    res = filter(rawData, ast.columns); 
    res.should.eql([22]);
  
    str = "select COUNT(a.id) from data";
    ast = Parser.parse(str);
    //inspect(ast.columns);
    res = filter(rawData, ast.columns); 
    res.should.eql([7]);

    str = "select avg(a.id) from data";
    ast = Parser.parse(str);
    //inspect(ast.columns);
    res = filter(rawData, ast.columns); 
    res.should.eql([22/7]);

    str = "select Min(a.id) from data";
    ast = Parser.parse(str);
    //inspect(ast.columns);
    res = filter(rawData, ast.columns); 
    res.should.eql([1]);

    str = "select MAX(a.id) from data";
    ast = Parser.parse(str);
    //inspect(ast.columns);
    res = filter(rawData, ast.columns); 
    res.should.eql([6]);

    str = "select MAX(a.id)+1, min(a.name), max(b.type) from data";
    ast = Parser.parse(str);
    //inspect(ast.columns);
    res = filter(rawData, ast.columns); 
    res.should.eql([7, 'a', 't4']);

    str = "select a.id, min(a.name), max(b.type) from data";
    ast = Parser.parse(str);
    //inspect(ast.columns);
    res = filter(rawData, ast.columns); 
    res.should.eql([1, 'a', 't4']);
  });


});
