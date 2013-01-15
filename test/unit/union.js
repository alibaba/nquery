var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('union test',function(){
  it('basic test', function(){
    var sql, ast;
    sql = 'select 1 union select true';
    ast = Parser.parse(sql);

    ast.should.eql({ 
      type: 'select',
      distinct: '',
      columns: [ 
        { expr: { type: 'number', value: 1 },as: '' } 
      ],
      from: '',
      where: '',
      groupby: '',
      orderby: '',
      limit: '',
      _next: { 
        type: 'select',
        distinct: '',
        columns: [ 
          { expr: { type: 'bool', value: true }, as: '' } 
        ],
        from: '',
        where: '',
        groupby: '',
        orderby: '',
        limit: ''
      } 
    });
  })
  
})

