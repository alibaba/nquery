// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Jobs              = require('../lib/jobs');
var Table             = require('../lib/table');
var Merger            = require('../lib/merger');
var Engine            = require('../lib/engine');
var Context           = require('../lib/context');
var Executor          = require('../lib/executor');
var AstHelper         = require('../lib/ast_helper');

var runAST            = Executor.runAST;
var runPlain          = Engine.run;
var AstReader         = AstHelper.Reader;
var doSelectOnTable   = Executor.doSelectOnTable;

function debug(str) {
  //console.log(str);  
}

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));  
}

function doAssign(left, right, ctx) {
  //var typeVal = js2nSQL(right);
  var typeVal = right;
  //TODO ,if complicated type ,should CLONE
  var varid   = left.name;
  var members = left.members;
  if (members.length > 0) {
    var obj = ctx[varid]; 
    var len = members.length;
    for (var i = 0; i < len - 1; i++) {
      obj = obj[members[i]];
    }
    var lastMem = members[len - 1];
    obj[lastMeb] = typeVal; 
  } else {
    ctx[varid] = typeVal;
  }
  //debug('ctx now :');
  //inspect(ctx);
}

function runExpr(expr, ctx, cb) {
  //debug(runExpr);
  //inspect(expr);
  if (expr.type == 'select') {
    var tables = expr.from;
    var varTableNum = 0;
    for (var i = 0; i < tables.length; i++) {
      if (tables[i].type == 'var') {
        varTableNum++;
      }
    }
    if (varTableNum == tables.length) {
      var tbl = doTableJoin(tables, ctx);
      var ar = new AstReader(expr);
      //inspect('temp join table :');
      //inspect(tbl);
      tbl = doSelectOnTable(tbl, ar, ctx);
      tbl = new Table(tbl);
      cb(null, tbl);
    } else {
      if (varTableNum > 0) {
        throw Error('can\'t do join when one or more tables are not ready...');
      } else {
        //debug('runAST in procedure');
        runAST(expr, ctx, function(err, dc) {
          if (err) {
            cb(err);  
          } else {
            cb(null, new Table(dc));  
          }
        });
      }
    }
  } else {
    Context.setctx(ctx);
    var data = runPlain(expr);
    cb(null, data);
  }
}

function doTableJoin(from, ctx) {
  var tbs = [];
  var ons = [];
  var ops = [];
 
  var tb, op, on;
  var i, tbunit;
  var tbName, tbAlias;
  for (i = 0; i < from.length; i++) {
    tbunit = from[i];
    inspect(tbunit);
    tb = Context.getBindVar(tbunit, ctx); 
    //here we should add table/alias info to the data
    
    tbName = tbunit.name;
    tbAlias= (tbunit.as != '') ? tbunit.as : undefined;
    tb = tb.get(tbName, tbAlias);

    op = tbunit.join;
    on = regularOnExpr(tbunit.on);

    tbs.push(tb);
    ops.push(op);
    ons.push(on);
  }

  var res = tbs[0];
  for (i = 1; i < tbs.length; i++) {
    res = Merger.join(res, tbs[i], ops[i], ons[i]);
  }
  return res;
}

function regularOnExpr(on) {
  //first split and
  var rels = [];
  var stack = [];
  var expr;
  if (on) {
    stack.push(on);
  }
  while (stack.length > 0) {
    expr = stack.pop();
    if (expr.type == 'binary_expr' && expr.operator == 'AND') {
      stack.push(expr.right);
      stack.push(expr.left);
    } else {
      rels.push(expr);
    }
  }
  var ons = {
    left : [],
    right: []
  }
  var rel;
  for (var i = 0; i < rels.length; i++) {
    rel = rels[i];
    ons.left.push({
      table : rel.left.table,
      column: rel.left.column
    })
    ons.right.push({
      table : rel.right.table,
      column: rel.right.column
    })
  }
  return ons;
}

exports.run = run;

function run(stps, cb) {
  var i, j, stm,  stmts;
  var ret;
  var t, tasks; 
  var jobs = [];
  var ctx = {};
  for (i = 0; i < stps.length; i++) {
    stmts = stps[i];
    tasks = [];
    for (j = 0; j < stmts.length; j++) {
      t = new Task(stmts[j], ctx);
      tasks.push(t);
    }
    jobs.push(tasks);
  }

  Jobs.doSequential(jobs, function(err) {
    if (err) {
      cb(err);
    } else {
      var obj = ctx['__return'];
      if (obj instanceof Table) {
        obj = obj.getData();  
      } else {
        hackTable(obj);  
      }
      cb(null, obj);  
    }
  });
}

function hackTable(obj) {
  if (Array.isArray(obj)) {
    var i, len, ele;
    len = obj.length;
    for (i =0; i < len; i++) {
      ele = obj[i];
      if (ele instanceof Table) {
        obj[i] = ele.getData();
      } else {
        hackTable(obj[i]);  
      }
    }
  }
}

function Task(stm, ctx) {
  this._stm = stm;
  this._ctx = ctx;
}

Task.prototype.run = function(cb) {
  var stm = this._stm;
  var ctx = this._ctx;
  runExpr(stm.right, ctx, function(err, data) {
    if (err) {
      cb(err);
    } else {
      doAssign(stm.left, data, ctx);
      cb(null);
    }
  });
}

