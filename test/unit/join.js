/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
// +--------------------------------------------------------------------+
// | (C) 2011-2012 Alibaba Group Holding Limited.                       |
// | This program is free software; you can redistribute it and/or      |
// | modify it under the terms of the GNU General Public License        |
// | version 2 as published by the Free Software Foundation.            |
// +--------------------------------------------------------------------+
// Author: fengyin <pengchun@taobao.com>

var should  = require('should');
var Join  = require(__dirname + '/../../base/join');

var ta, tb;

describe('join test', function() {

  before(function(){
  ta = {
    columns : [
      [{table : 'a', column : 'id'}],
      [{table : 'a', column : 'name'}],
      [{table : 'a', column : 'text'}]
    ],
    data : [
      [1, 'a', 'ta'],
      [2, 'b', 'tb'],
      [5, 'e', 'te'],
      [7, 'f', 'tf']
    ]
  }

  tb = {
    columns : [
      [{table : 'b', column : 'id'}],
      [{table : 'b', column : 'name'}],
      [{table : 'b', column : 'des'}]
    ],
    data : [
      [2, 'c', 'db'],
      [2, 'd', 'db'],
      [6, 'e', 'de'],
      [7, 'f', 'df'],
      [8, 'e', 'de'],
    ]
  }
    
  });

  it('basic inner join ', function() {

    var on = {
      left :  [{table : 'a', column : 'id'}],
      right : [{table : 'b', column : 'id'}]
    }

    var res = Join.innerJoin(ta, tb ,on)
    res.should.eql({
      columns : [
        [
          {table : 'a', column : 'id'},
          {table : 'b', column : 'id'}
        ],
        [{table : 'a', column : 'name'}],
        [{table : 'a', column : 'text'}],
        [{table : 'b', column : 'name'}],
        [{table : 'b', column : 'des'}]
      ],
      data : [
        [2, 'b', 'tb', 'c', 'db'],
        [2, 'b', 'tb', 'd', 'db'],
        [7, 'f', 'tf', 'f', 'df']
      ]
    })

  });

  it('multi-column inner join', function() {
    var on = {
      left  : [{table : 'a', column : 'id'}, {table : 'a', column : 'name'}],
      right : [{table : 'b', column : 'id'}, {table : 'b', column : 'name'}]
    }
    var res = Join.innerJoin(ta, tb ,on)
    res.should.eql({
      columns : [
        [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
        [{table : 'a', column : 'name'}, {table : 'b', column : 'name'}],
        [{table : 'a', column : 'text'}],
        [{table : 'b', column : 'des'}]
      ],
      data : [
        [7, 'f', 'tf', 'df']
      ]
    })
  });

  it('basic left join ', function() {

    var on = {
      left : [{table : 'a', column : 'id'}],
      right : [{table : 'b', column : 'id'}]
    }

    var res = Join.leftJoin(ta, tb ,on);
    res.should.eql({
      columns : [
        [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
        [{table : 'a', column : 'name'}],
        [{table : 'a', column : 'text'}],
        [{table : 'b', column : 'name'}],
        [{table : 'b', column : 'des'}]
      ],
      data : [
        [1, 'a', 'ta', null,  null],
        [2, 'b', 'tb', 'c', 'db'],
        [2, 'b', 'tb', 'd', 'db'],
        [5, 'e', 'te', null,  null],
        [7, 'f', 'tf', 'f', 'df']
      ]
    })

  });

  it('multi-column left join ', function() {

    var on = {
      left  : [{table : 'a', column : 'id'}, {table : 'a', column : 'name'}],
      right : [{table : 'b', column : 'id'}, {table : 'b', column : 'name'}]
    }

    var res = Join.leftJoin(ta, tb ,on);
    res.should.eql({
      columns : [
        [{table : 'a', column : 'id'}, {table : 'b', column : 'id'}],
        [{table : 'a', column : 'name'}, {table : 'b', column : 'name'}],
        [{table : 'a', column : 'text'}],
        [{table : 'b', column : 'des'}]
      ],
      data : [
        [1, 'a', 'ta', null],
        [2, 'b', 'tb', null],
        [5, 'e', 'te', null],
        [7, 'f', 'tf', 'df']
      ]
    })

  });

});
