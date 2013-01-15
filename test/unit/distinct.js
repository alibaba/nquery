/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */
// +--------------------------------------------------------------------+
// | (C) 2011-2012 Alibaba Group Holding Limited.                       |
// | This program is free software; you can redistribute it and/or      |
// | modify it under the terms of the GNU General Public License        |
// | version 2 as published by the Free Software Foundation.            |
// +--------------------------------------------------------------------+

var should      = require('should');
var distinct    = require('../../base/distinct');

var AstReader   = require('../../lib/ast_helper').Reader;

describe('disticnt test', function() {

  it('basic distinct test', function() {
    var data = {
    
      columns : ['a', 'b', 'c'],
      data : [
        [1,   2, 3],
        ['1', 2, 3],
        [2,   3, 4],
        [2,   4, 4],
        [4,   3, 4],
        [3,   3, 4],
        [2,   3, 4],
        [2,   4, 4],
        [6,   3, 4],
        [1,   2, 3],
      ]
    }

    var res = distinct(data);
    res.data.should.eql([
        [1,   2, 3],
        ['1', 2, 3],
        [2,   3, 4],
        [2,   4, 4],
        [4,   3, 4],
        [3,   3, 4],
        [6,   3, 4],
      ]
    );
  });

});
