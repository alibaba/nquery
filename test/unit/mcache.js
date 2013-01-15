var should = require('should');
var MCache = require('../../base/mcache');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('union test', function(){
  it('basic test', function(){
    var cache = new MCache(10000);

    for (var i = 0; i <=20000; i++) {
      cache.set(i, i);  
    }

    should.not.exist(cache.get(9999));
    should.not.exist(cache.get(10000));
    should.not.exist(cache.get(2000001));

    cache.get(7).should.eql(7);
    cache.get(10).should.eql(10);
    cache.get(9998).should.eql(9998);

    cache.get(20000).should.eql(20000);

    cache.top(12).should.eql([
     0, 1, 2, 3, 4, 5, 7, 6, 8, 10, 9, 11
    ])
  });

});
