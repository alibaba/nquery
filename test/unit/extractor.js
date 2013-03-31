var should    = require('should');
var Parser    = require('../../lib/parser');
var Engine    = require('../../lib/engine');
var Context   = require('../../lib/context');
var Extractor = require('../../lib/extractor');

var Topo      = require('../../base/topology');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

describe('extractor test',function(){
  var options = {
    'storageType' : 'kv',
    'primaryKeys' : ['id'],
    'rangeQuery'  : true,
    'prefixMatch' : true
  }

  it('single-key simple test', function() {
    var sql ,ast, info;
    //sql = "select * from a where id > 0 AND name < 0 and id = 3 and type = 't' and id in ('1', '2') AND (id = 4 OR id =5) OR id = 2",
    sql = "select * from a where id = 2",
    ast = Parser.parse(sql);
    inspect(ast);
    info = Extractor.getKeyInfo(ast.where, options);

    info.should.eql({
      'IN' : [2]  
    })

    sql = "select * from a where id = 2 OR nid = 2",
    ast = Parser.parse(sql);
    inspect(ast);
    try {
      info = Extractor.getKeyInfo(ast.where, options);
    } catch(e) {
      e.message.should.include('primary keys not ful-filled');
    }
  });   

  it('single-key and link test', function() {
    var sql ,ast, info;
    sql = "select * from a where id > 0 AND name < 0 and id = 3 and type = 't' and id in ('1', '2') AND (id = 4 OR id =5)",
    //sql = "select * from a where id > 0 AND name < 0 and id = 3";
    ast = Parser.parse(sql);
    inspect(ast);
    info = Extractor.getKeyInfo(ast.where, options);
    inspect(info);
    info.should.eql({
      'IN' : [3, '1', '2', 4, 5]
    })
  });   

  it('single-key OR link test', function() {
    var sql ,ast, info;
    sql = "select * from a where id > 0 AND id = 3 OR (id = 4 OR id =5)",
    //sql = "select * from a where id > 0 AND name < 0 and id = 3";
    ast = Parser.parse(sql);
    inspect(ast);
    info = Extractor.getKeyInfo(ast.where, options);
    inspect(info);
    info.should.eql({
      'IN' : [3, 4, 5]
    })
  });   

  it('single-key bind var test', function() {
    var sql ,ast, info, env;
    sql = "select * from a where id > 0 AND id = $id OR id = $id + 3 OR id = $arr";
    env = {
      id : -1,
      arr : [4, 5]
    }
    //sql = "select * from a where id > 0 AND name < 0 and id = 3";
    ast = Parser.parse(sql);
    inspect(ast);
    Context.setctx(env);
    info = Extractor.getKeyInfo(ast.where, options);
    inspect(info);
    info.should.eql({
      'IN' : [-1, 2, 4, 5]
    })
  });   

  it('single-key range-query test', function() {
    var sql ,ast, info, env;
    sql = "select * from a where  id = 2 OR id between 5 and 7";
    //sql = "select * from a where id > 0 AND name < 0 and id = 3";
    ast = Parser.parse(sql);
    inspect(ast);
    info = Extractor.getKeyInfo(ast.where, options, env);
    inspect(info);
    info.should.eql({
      'IN' : [2],
      'BETWEEN' : [
        [5, 7]
      ]
    })
  });   

  it('single-key prefix-match test', function() {
    var sql ,ast, info, env;
    sql = "select * from a where  id = 2 OR id LIKE 'hello%' OR id LIKE 'world%'";
    //sql = "select * from a where id > 0 AND name < 0 and id = 3";
    ast = Parser.parse(sql);
    inspect(ast);
    info = Extractor.getKeyInfo(ast.where, options, env);
    inspect(info);
    info.should.eql({
      'IN' : [2],
      'LIKE' : [
        'hello', 'world'
      ]
    })
  });   

});   
