// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Parser            = require('./parser');
var Executor          = require('./executor');

var Procedure         = require('../base/procedure');
var Topology          = require('../base/topology');

var runAST        = Executor.runAST;
var runProc       = Procedure.run;
var doAstOrder    = Topology.order;

exports.runSQL = function (str, cb) {
  var ast;
  try {
    ast = Parser.parse(str);
  } catch (e) {
    cb(e)
    return; 
  }

  if (Array.isArray(ast)) {
    var stps = doAstOrder(ast);
    runProc(stps, cb);
  } else {
    runAST(ast, cb);
  }
}

