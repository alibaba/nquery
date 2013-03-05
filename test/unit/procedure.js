var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('procedure test',function(){
  
  it('assign test', function() {
    var sql, ast;

    sql = [
      "$a := 'str'",
      "$b := $a + 1",
      "$c := $a.c + $b",
    ];
    sql = sql.join('\n');
    ast = Parser.parse(sql);
    inspect(ast);

    sql = [
      "$a := fn(1)",
      "$b := 1",
      "$c := 1 + fn($b)",
      "$c := [1, 's', false, null]"
    ];
    sql = sql.join('\n');

    ast = Parser.parse(sql);
    inspect(ast);

    sql = "select * from $ta where $ta.id > 0 and $test = 2";
    ast = Parser.parse(sql);
    inspect(ast);

    sql = "$c := $a inner join $b on $a.id >$b.id";
    ast = Parser.parse(sql);
    inspect(ast);

    sql = "return [$a, 1, 'str']";
    ast = Parser.parse(sql);
    inspect(ast);
    /*
    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3";
    ast = Parser.parse(sql);

    ast.distinct.should.eql('DISTINCT');
    ast.from.should.not.eql('');
    ast.where.should.not.eql('');
    ast.groupby.should.not.eql('');
    ast.orderby.should.not.eql('');
    ast.limit.should.not.eql('');
    */
  });   
});   

