var should = require('should');

var Jobs = require(__dirname + '/../../lib/jobs');

function debug(str) {
  //console.log(str);  
}
function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

function Task(fn) {
  this._fn = fn;
}

Task.prototype.run = function(cb) {
  this._fn(cb);
}

var t0 = new Task(function(cb) {
  debug('task 0 init');
  debug('task 0 ok');
  cb(null);
});

var t1 = new Task(function(cb) {
  debug('task1 init');
  setTimeout(function() {
    debug('task 1 ok');
    cb(null);
  }, 5);
});

var t2 = new Task(function(cb) {
  debug('task2 init');
  setTimeout(function() {
    debug('task 2 ok');
    cb(null);
  }, 30);
});

var t3 = new Task(function(cb) {
  debug('task3 init');
  setTimeout(function() {
    debug('task 3 err');
    cb(new Error('Task3 Failed'));
  }, 10);
});


describe('jobs test', function(){

  it('concurrent ok test', function(done) {
    Jobs.doConcurrent([t0, t1, t2], function(err){
      should.equal(null, err);
      done();
    });
  });
    
  it('concurrent error test', function(done) {
    Jobs.doConcurrent([t0, t3, t2], function(err){
      err.message.should.eql('Task3 Failed')
      done();
    });
  });

  it('sequential ok test', function(done) {
    Jobs.doSequential([t0, t1, t2], function(err){
      should.equal(null, err);
      done();
    });
  });

  it('sequential error test', function(done) {
    Jobs.doSequential([t0, t3, t2], function(err){
      err.message.should.eql('Task3 Failed')
      done();
    });
  });

});
