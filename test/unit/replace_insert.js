var should = require('should');
var Parser = require(__dirname + '/../../lib/parser');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('replace test',function(){
  
  it('insert test', function() {
    var sql, ast;

    sql = "INSERT INTO cubemeta.meta_user_loginlog_trial (user_id, username, login_time, login_ip, login_url) VALUES ('uid1', 'use1', 'login', 'login_ip', 'login_url')";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.should.eql({
      type: 'insert',
      db: 'cubemeta',
      table: 'meta_user_loginlog_trial', 
      columns: [ 'user_id','username','login_time','login_ip','login_url'],
      values: [ 
        {
          type  : 'expr_list',  
          value : [
            { type: 'string', value: 'uid1' },
            { type: 'string', value: 'use1' },
            { type: 'string', value: 'login' },
            { type: 'string', value: 'login_ip' },
            { type: 'string', value: 'login_url' }
          ]
        }
      ] 
    })
  });   

  it('replace test', function() {
    var sql, ast;

    sql = "REplace INTO a.b (c1, c2)VALUES('d', '2'), ('e',1), (TRUE, null)";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.should.eql({
      type: 'replace',
      db: 'a',
      table: 'b',
      columns: [ 'c1', 'c2' ],
      values: [ 
        { 
          type : 'expr_list', 
          value : [
            { type: 'string', value: 'd' },
            { type: 'string', value: '2' } 
          ] 
        },
        {
          type : 'expr_list',
          value : [
            { type: 'string', value: 'e' },
            { type: 'number', value: 1 } 
          ]
        },
        {
          type  : 'expr_list',
          value : [
            { type: 'bool', value: true },
            { type: 'null', value: null } 
          ]
        }
      ] 
    })
  });   
});   

