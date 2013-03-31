var should  = require('should');
var doGroupby = require('../../base/groupby');

function inspect(obj){
  console.log(require('util').inspect(obj, false, 10));
}

describe('data filter test', function(){

  var rawData = { 
    columns: [
      [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
      [{table : 'a', column : 'name'}],
      [{table : 'b', column : 'type'}]
    ],
    data: [ 
      [ 1, 'a', 't1' ], 
      [ 2, 'b', 't2' ], 
      [ 2, 'b', 't3' ], 
      [ 3, 'c', 't3' ], 
      [ 3, 'c', 't4' ], 
      [ 5, 'b', 't3' ], 
      [ 6, 'b', 't4' ] 
    ] 
  };

  it('groupb data test', function(){
    var gbArr = [{table : 'a', column : 'name'}, {table : 'b', column : 'id'}];
    var eData = {
      'string_a__number_1' : {
        columns: [
          [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
          [{table : 'a', column : 'name'}],
          [{table : 'b', column : 'type'}]
        ],
        data: [ 
          [ 1, 'a', 't1' ] 
        ] 
      },
      'string_b__number_2' : {
        columns: [
          [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
          [{table : 'a', column : 'name'}],
          [{table : 'b', column : 'type'}]
        ],
        data: [ 
          [ 2, 'b', 't2' ], 
          [ 2, 'b', 't3' ], 
        ] 
      },
      'string_c__number_3' : {
        columns: [
          [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
          [{table : 'a', column : 'name'}],
          [{table : 'b', column : 'type'}]
        ],
        data: [ 
          [ 3, 'c', 't3' ], 
          [ 3, 'c', 't4' ] 
        ] 
      },
      'string_b__number_5' : {
        columns: [
          [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
          [{table : 'a', column : 'name'}],
          [{table : 'b', column : 'type'}]
        ],
        data: [ 
          [ 5, 'b', 't3' ], 
        ] 
      },
      'string_b__number_6' : {
        columns: [
          [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
          [{table : 'a', column : 'name'}],
          [{table : 'b', column : 'type'}]
        ],
        data: [ 
          [ 6, 'b', 't4' ] 
        ] 
      }
    };

    var sData = doGroupby(rawData, gbArr);
    //inspect(sData);
    JSON.stringify(sData).should.eql(JSON.stringify(eData));
  });


});
