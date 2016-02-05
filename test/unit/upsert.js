var should = require('should');
var Parser = require('../../lib/parser');
var Adapter = require('../../lib/adapter');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));
}

describe('upsert test',function(){
  it('should parse', function() {
    var sql, ast;

    sql = "INSERT INTO `user_info` SET `last_login_time` = '2012-12-18 12:44:21', `last_login_ip` = 'hohoo' ON duplicate KEY UPDATE `last_login_time` = '2012-12-18 12:44:21', `last_login_ip` = 'hohoo'";

    ast = Parser.parse(sql);

    //inspect(ast);
    ast.should.eql({
      type: 'insert',
      db: '',
      table: 'user_info',
      set: [
        {
          column: 'last_login_time',
          value:{ type: 'string', value: '2012-12-18 12:44:21' }
        },
        {
          column: 'last_login_ip',
          value: { type: 'string', value: 'hohoo' }
        }
      ],
      duplicateSet: [
        {
          column: 'last_login_time',
          value:{ type: 'string', value: '2012-12-18 12:44:21' }
        },
        {
          column: 'last_login_ip',
          value: { type: 'string', value: 'hohoo' }
        }
      ]
    });
  });
});

describe('upsert test',function(){
  it('should be able to adapt out', function() {
    var sql, ast;

    sql = "INSERT INTO `user_info` SET `last_login_time` = '2012-12-18 12:44:21', `last_login_ip` = 'hohoo' ON DUPLICATE KEY UPDATE `last_login_time` = '2012-12-18 12:44:21', `last_login_ip` = 'hohoo'";

    ast = Parser.parse(sql);

    Adapter.toSQL(ast, { back_ticks: true }).should.eql(sql);
  });
});

