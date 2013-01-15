var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('select test',function(){
  
  it('clauses test', function() {
    var sql, ast;

    sql = "SELECT a";
    ast = Parser.parse(sql);

    ast.columns.length.should.eql(1)
    ast.distinct.should.eql('');
    ast.where.should.eql('');
    ast.from.should.eql('');
    ast.groupby.should.eql('');
    ast.orderby.should.eql('');
    ast.limit.should.eql('');


    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3";
    ast = Parser.parse(sql);

    ast.distinct.should.eql('DISTINCT');
    ast.from.should.not.eql('');
    ast.where.should.not.eql('');
    ast.groupby.should.not.eql('');
    ast.orderby.should.not.eql('');
    ast.limit.should.not.eql('');
  });   

  it('limit test', function() {
    var sql, ast;

    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3";
    ast = Parser.parse(sql);

    ast.limit.should.eql([{type :'number', value : 0}, {type :'number', value : 3}]);

    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 0, 3";
    ast = Parser.parse(sql);

    ast.limit.should.eql([{type :'number', value : 0}, {type :'number', value : 3}]);
  });   

  it('group by test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c = 0 GROUP BY d, t.b, t.c";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.groupby.should.eql([
      { type: 'column_ref', table: '', column: 'd' },
      { type: 'column_ref', table: 't', column: 'b' },
      { type: 'column_ref', table: 't', column: 'c' }
    ]);
  });   
  
  it('order by test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c = 0 order BY d, t.b dEsc, t.c, SuM(e)";
    ast = Parser.parse(sql);

    inspect(ast.orderby);
    ast.orderby.should.eql([
      { expr: { type: 'column_ref', table: '', column: 'd' },type: 'ASC' },
      { expr: { type: 'column_ref', table: 't', column: 'b' },type: 'DESC' },
      { expr: { type: 'column_ref', table: 't', column: 'c' },type: 'ASC' },
      {   
        expr: { 
            type: 'aggr_func',   
            name: 'SUM', 
            args: {
              expr: { type: 'column_ref', table: '', column: 'e' } 
            }
        },
        type: 'ASC'
      }
    ]);
  });   

  it('column clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t";
    ast = Parser.parse(sql);
    ast.columns.should.eql('*');

    sql = "SELECT a aa, b.c as bc, fun(d), 1+3 FROM  t";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.columns.should.eql([
      { expr: { type: 'column_ref', table: '', column: 'a' }, as: 'aa' },
      { expr: { type: 'column_ref', table: 'b', column: 'c' },  as: 'bc' },
      { 
        expr: { 
          type: 'function', 
          name: 'fun', 
          args: {
            type  : 'expr_list',  
            value : [ { type: 'column_ref', table: '', column: 'd' } ]
          }
        },
        as: '' 
      },
      { 
        expr: { 
          type: 'binary_expr', 
          operator: '+',
          left: {
            type  : 'number',
            value : 1 
          },
          right: {
            type  : 'number',
            value : 3
          }
        },
        as: '' 
      } 
    ]);
   
  });   

  it('where clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t where t.a > 0 AND t.c between 1 and 't' AND Not true";
    ast = Parser.parse(sql);

    //inspect(ast.where);
    ast.where.should.eql({
      type: 'binary_expr',
      operator: 'AND',
      left: { 
        type: 'binary_expr',
        operator: 'AND',
        left: { 
          type: 'binary_expr',
          operator: '>',
          left: { 
            type: 'column_ref',
            table: 't',
            column: 'a' 
          },
          right: { 
            type: 'number', value: 0
          } 
        },
        right: { 
          type: 'binary_expr',
          operator: 'BETWEEN',
          left: { 
            type: 'column_ref',
            table: 't',
            column: 'c' 
          },
          right: { 
            type : 'expr_list',
            value : [
              { type: 'number', value: 1 },
              { type: 'string', value: 't' } 
            ]
          } 
        } 
      },
      right: { 
        type: 'unary_expr',
        operator: 'NOT',
        expr: { 
          type: 'bool', value: true } 
        } 
      });

  });   

  it('from clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t, a.b b, c.d as cd";
    ast = Parser.parse(sql);

    //inspect(ast.from);
    ast.from.should.eql([ 
      { db: '', table: 't', as: '' },
      { db: 'a', table: 'b', as: 'b' },
      { db: 'c', table: 'd', as: 'cd' } 
    ]);


    sql = "SELECT * FROM t join a.b b on t.a = b.c left join d on d.d = d.a";
    ast = Parser.parse(sql);

    //inspect(ast.from);
    ast.from.should.eql([ 
      { db: '', table: 't', as: '' },
      { 
        db: 'a',
        table: 'b',
        as: 'b',
        join: 'INNER JOIN',
        on: { 
          type: 'binary_expr',
          operator: '=',
          left: { 
            type: 'column_ref',
            table: 't',
            column: 'a'
          },
          right: { 
            type: 'column_ref',
            table: 'b',
            column: 'c' 
          }
        } 
      },
      { 
        db: '',
        table: 'd',
        as: '',
        join: 'LEFT JOIN',
        on: { 
          type: 'binary_expr',
          operator: '=',
          left: { 
            type: 'column_ref',
            table: 'd',
            column: 'd'
          },
          right: { 
            type: 'column_ref',
            table: 'd',
            column: 'a' 
          }
        }
      }
    ]);

  });   

  it('from clause test', function() {
    var sql, ast;

    sql = "select i_item_id, i_list_price, avg(ss_sales_price) agg1 FROM store_sales JOIN item on (store_sales.ss_item_id = item.i_item_id) JOIN customer on (store_sales.ss_customer_id = customer.c_id)";
    ast = Parser.parse(sql);

    //inspect(ast);
    //ast.from.should.eql([});   
  });

  it('keyword as table test', function() {
    var sql, ast;
    sql = 'select * from service_a.table as sa inner join service_b.table as sb on sa.id=sb.id where sa.fm=f and sb.id=3'

    ast = Parser.parse(sql);
    //inspect(ast);
    //ast.from.should.eql([});   
  });

})

