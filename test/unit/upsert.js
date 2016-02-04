var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));
}

describe('upsert test',function(){
  it('insert test', function() {
    var sql, ast;

    sql = "INSERT INTO `user_lauer_testing` SET `user_id` = '123', `username` = 'mike' ON duplicate KEY UPDATE `user_id` = '123', `username` = 'bob'";

    try {
      ast = Parser.parse(sql);
    } catch (e) {
      console.log(JSON.stringify(e));
    }

    //inspect(ast);
    ast.should.eql({
      type: 'update',
      db: 'db',
      table: 'user_info',
      set: [
        {
          column: 'last_login_time',
          value:{ type: 'string', value: '2012-12-18 12:44:21' }
        },
        {
          column: 'last_login_ip',
          value: { type: 'string', value: 'hohoo' }
        },
        {
          column: 'login_count',
          value:{
            type: 'binary_expr',
            operator: '+',
            left: {
              type: 'column_ref',
              table: '',
              column: 'login_count'
            },
            right: {
              type: 'number', value: 1
            }
          }
        }
      ],
      where: {
        type: 'binary_expr',
        operator: '=',
        left: {
          type: 'column_ref',
          table: '',
          column: 'id'
        },
        right: {
          type: 'number', value: 334094
        }
      }
    })

  });

});

