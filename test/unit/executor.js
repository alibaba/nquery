var should   = require('should');
var Parser   = require('../../lib/parser');
var Executor = require('../../lib/executor');

function debug(str) {
  console.log(str);  
}

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('executor test', function(){
  var rawData = { 
    columns: [ 
      'id', 'sex'
     ],
    data: [ 
      [ 3, 'f' ], 
      [ 4, 'f' ], 
      [ 6, 'f' ], 
      [ 8, 'f' ], 
      [ 10, 'f' ] 
    ] 
  };

  it('column all test', function(done){
    var str, ast;

    str = 'select * from a'
    ast = Parser.parse(str);
    Executor.setLoader(function(ar, env, cb){
      cb(null, rawData, ar);
    });

    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns: [ 
            'id', 'sex'
          ],
          data: [ 
            [ 3, 'f' ], 
            [ 4, 'f' ], 
            [ 6, 'f' ], 
            [ 8, 'f' ], 
            [ 10, 'f' ] 
          ] 
        });
        done();
      }
    });
  });

  it('column select test', function(done){
    var str = 'select id from a';
    var ast = Parser.parse(str);

    Executor.setLoader(function(ar, env, cb){
      cb(null, rawData, ar);
    });

    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns : ['id'],
          data : [
            [3],
            [4],
            [6],
            [8],
            [10]
          ]
        });
        done();
      }
    });
  });

  it('as column name replace ', function(done){
    var str = 'select id as rid, sex as rsex from a'
    Executor.setLoader(function(ar, env, cb){
      cb(null, rawData, ar);
    });
    var ast = Parser.parse(str);
    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns: [ 'rid', 'rsex' ],
          data: [ 
            [ 3, 'f' ], 
            [ 4, 'f' ], 
            [ 6, 'f' ], 
            [ 8, 'f' ], 
            [ 10, 'f' ] 
          ] 
        })
        done();
      }
    });
  });

  it('limits filter test', function(done){
    var str = 'select * from a limit 1, 2'
    Executor.setLoader(function(ar, env, cb){
      cb(null, rawData, ar);
    });

    var ast = Parser.parse(str);
    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns: [ 'id', 'sex' ],
          data: [ 
            [ 4, 'f' ], 
            [ 6, 'f' ] 
          ] 
        })
        done();
      };
    });
  });

  it('order filter test', function(done){
    var rawData = { 
      columns: [ 
        'id', 'sex'
      ],
      data: [ 
        [ 3, 'a' ], 
        [ 4, 'f' ], 
        [ 4, 'b' ], 
        [ 8, 'f' ], 
        [ 10, 'c' ] 
      ] 
    };
    var str = 'select * from a order by sex ASc, id DESC '
    Executor.setLoader(function(ar, env, cb){
      cb(null, rawData, ar);
    });

    var ast = Parser.parse(str);
    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns: [ 'id', 'sex' ],
          data: [ 
            [ 3, 'a' ], 
            [ 4, 'b' ], 
            [ 10, 'c' ], 
            [ 8, 'f' ], 
            [ 4, 'f' ] 
          ] 
        });
        done();
      };
    });
  });

  it('groupby filter test', function(){
    var rawData = { 
      columns: [ 
        'id', 'sex'
      ],
      data: [ 
        [ 3, 'a' ], 
        [ 4, 'f' ], 
        [ 4, 'g' ], 
        [ 4, 'b' ], 
        [ 4, 'b' ], 
        [ 8, 'b' ], 
        [ 8, 'a' ], 
        [ 9, 'f' ], 
        [ 10, 'c' ] 
      ] 
    };

    Executor.setLoader(function(ar, env, cb){
      cb(null, rawData, ar);
    });
    var str = 'select id, sex from data group by id'

    var ast = Parser.parse(str);
    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns: [ 'id', 'sex' ],
          data: [ 
            [ 3, 'a' ], 
            [ 4, 'f' ], 
            [ 8, 'b' ], 
            [ 9, 'f' ], 
            [ 10, 'c' ] 
          ] 
        });
      }
    });

    str = 'select id, count(id) from data group by id'

    ast = Parser.parse(str);
    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns: [ 'id', 'COUNT(id)' ],
          data: [ 
            [ 3, 1 ], 
            [ 4, 4 ], 
            [ 8, 2 ], 
            [ 9, 1 ], 
            [ 10, 1 ] 
          ] 
        });
      }
    });

  })

  it('groupby&orderby ', function(){
    var rawData = { 
      columns : [
        'id', 'sex'
      ],
      data: [ 
        [ 3, 'a' ], 
        [ 4, 'f' ], 
        [ 4, 'g' ], 
        [ 4, 'b' ], 
        [ 4, 'b' ], 
        [ 8, 'b' ], 
        [ 8, 'a' ], 
        [ 9, 'f' ], 
        [ 10, 'c' ] 
      ] 
    };

    Executor.setLoader(function(ar, env, cb){
      cb(null, rawData, ar);
    });
    var str = 'select id, min(sex) as msex from data group by id order by count(id)'

    var ast = Parser.parse(str);
    Executor.runAST(ast, function(err, dc){
      if (err) {
        debug(err.stack);
      } else {
        dc.should.eql({
          columns: [ 'id', 'msex' ],
          data: [ 
            [ 3, 'a' ], 
            [ 9, 'f' ], 
            [ 10, 'c' ], 
            [ 8, 'a' ], 
            [ 4, 'b' ], 
          ] 
        });
      }
    });

  });

});
