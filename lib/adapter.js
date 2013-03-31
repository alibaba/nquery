// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Context  = require('./context');

//http://dev.mysql.com/doc/refman/5.0/en/string-literals.html
// for mysql only
// NOTE: myfox != mysql
var escapeMap = {
  '\0'  : '\\0',
  '\''  : '\\\'',
  '\"'   : '\\\"',
  '\b'  : '\\b',
  '\n'  : '\\n',
  '\r'  : '\\r',
  '\t'  : '\\t',
  '\x1a': '\\Z',        /**<    EOF */
  '\\'  : '\\\\',
//  '%'   : '\\%',
//  '_'  :  '\_'
};
  
function escape(str) {
  var res = [];
  var c, e;
  for (var i = 0 ;i < str.length; i++) {
    c = str[i];  
    e = escapeMap[c];
    if (e) {
      c = e;
    }
    res.push(c);
  }
  return res.join('');
}

function inspect(obj) {
  //console.log(require('util').inspect(obj ,false, 10, true));  
}

function literalToSQL(l) {
  var ret;
  var t = l.type;
  var v = l.value;
  if (t == 'number') {
    //nothing
  } else if (t == 'string') {
    v = "'" + escape(v) + "'"; 
    //v = '"' + v + '"'; 
  } else if (t == 'bool') {
    v = v ? 'TRUE' : 'FALSE';  
  } else if (t == 'null') {
    v = 'NULL' 
  } else if (t == 'star') {
    v = '*';
  }

  if (l.paren) {
    return '(' + v + ')'; 
  } else {
    return v;  
  }
}

function unaryToSQL(e) {
  var str = e.operator + ' ' + exprToSQL(e.expr);
  if (e.paren) {
    return '(' + str  + ')';
  } else {
    return str;  
  }
}

function getExprListSQL(l) {
  var es = []; 
  for (var i = 0; i < l.length; i++) {
    es.push(exprToSQL(l[i]))
  }  
  return es;
}

function binaryToSQL(e) {
  var op    = e.operator;
  var left  = e.left;
  var right = e.right;

  var lstr = exprToSQL(left);  
  var rstr = exprToSQL(right);  
  if (Array.isArray(rstr)) {
    if (op == '=') {
      op = 'IN';
    } 
    if (op == 'BETWEEN') {
      rstr = rstr[0]  + ' AND ' + rstr[1];
    } else {
      rstr = '(' + rstr.join(', ') + ')';
    }
  }

  var str = lstr + ' ' + op + ' ' + rstr;
  if (e.paren) {
    return '(' + str + ')';
  } else {
    return str;  
  }
}

function aggrToSQL(e) {
  var args = e.args;
  var expr = args.expr
  var str = exprToSQL(args.expr);
  var name = e.name;
  if (name == 'COUNT') {
    //inspect(args);
    var d = args.distinct;
    if (d && d != '') {
      str = 'DISTINCT ' + str;
    }
  }
  //inspect(args);
  return name + '(' + str + ')';
}

function funcToSQL(e) {
  //var es  = getExprListSQL(e.args.value);
  var es  = exprToSQL(e.args);
  var str = e.name + '(' + es.join(', ') + ')';

  if (e.paren) {
    return  '(' + str + ')';
  } else {
    return str;  
  }
}

function columnRefToSQL(e) {
  var str = e.column;
  if (e.table && e.table != '') {
    str = e.table + '.' + str;
  }

  if (e.paren) {
    return '(' + str + ')';
  } else {
    return str;  
  }
}

exports.exprToSQL = exprToSQL;

function exprToSQL(e) {
  var t = e.type;
  var res ;
  switch (t) {
    case 'unary_expr'   :
      res = unaryToSQL(e);
      break;
    case 'binary_expr'  :
      res = binaryToSQL(e);
      break;
    case 'aggr_func'    :
      res = aggrToSQL(e);
      break;
    case 'function'    :
      res = funcToSQL(e);
      break;
    case 'column_ref' :
      res = columnRefToSQL(e);
      break;
    case 'expr_list' :
      res = getExprListSQL(e.value);
      break;
    case 'var' :
      res = varToSQL(e);
      break;
    default:
      res = literalToSQL(e);  
  }
  return res;
}

function js2nSQLExpr(val) {
  var type = typeof val;
  var obj = {}
  switch (type) {
    case 'string':
    case 'number':
      obj.type = type
      obj.value = val;
      break;
    case 'boolean':
      obj.type = 'bool';
      obj.value = val;
      break;
    case 'object':
      if (val === null) {
        obj.type = 'null';
        obj.value = val;
      } else if (Array.isArray(val)) {
        obj.type = 'expr_list';
        var arr = [];
        for (var i = 0; i < val.length; i++) {
          arr.push(js2nSQLExpr(val[i]));
        }
        obj.value = arr;
      } else {
        //TODO ,`object` type not supported now
        obj.type = 'object';
        obj.value = val;
      }
      break
    default:
      obj.type = 'unknown';
  }
  return obj;
}

function varToSQL(e) {
  var val  = Context.getBindVar(e);
  var expr = js2nSQLExpr(val);
  return exprToSQL(expr);
}

function unionToSQL(s, options) {
  var str = selectToSQL(s, options);
  var res = [];
  res.push(str);
  while (s._next) {
    str = selectToSQL(s._next, options); 
    res.push('UNION')
    res.push(str);
    s = s._next;
  }
  return res.join(' ');
}

function selectToSQL(s, options) {
  var distinct  = s.distinct;
  var columns   = s.columns;
  var from      = s.from;
  var where     = s.where;
  var groupby   = s.groupby;
  var orderby   = s.orderby;
  var limit     = s.limit;

  var clauses = [];
  var i, str;

  options = options || {};

  clauses.push('SELECT');
  //distinct
  if (distinct && distinct != '') {
    clauses.push(distinct); 
  }
  
  //column clause
  //inspect(columns);
  if (columns == '*') {
    clauses.push('*');
  } else {
    var cs = [];
    for (i = 0; i < columns.length; i++) {
      var ea = columns[i];
      str = exprToSQL(ea.expr);
      if (ea.as != '') {
        str += (' AS ' + ea.as);
      }
      cs.push(str);
    }   
    clauses.push(cs.join(', '));
  }

  //from clause
  if (Array.isArray(from)) {
    clauses.push('FROM');
    var cs = [];
    var tbase = from[0];
    str = tbase.table;
    if (options.keep_db !== false && tbase.db != '') {
      str = tbase.db + '.' + str;
    }
    if (tbase.as != '') {
      str += ' AS ' + tbase.as  
    }
    cs.push(str);
    for (i = 1; i < from.length; i++) {
      var  tref = from[i]; 
      if (tref.join && tref.join != '') {
         str = ' ' + tref.join + ' ';
      } else {
         str = ', ';  
      }
      if (options.keep_db !== false && tref.db != '') {
        str += (tref.db + '.');
      }
      str += tref.table;

      if (tref.as != '') {
        str += ' AS ' + tref.as  
      }

      if (tref.on && tref.on != '') {
         str += ' ON ' + exprToSQL(tref.on); 
      }
      cs.push(str);
    }
    clauses.push(cs.join(''));
  }

  //where clause
  if (where && where != '') {
    clauses.push('WHERE ' + exprToSQL(where)); 
  }
  
  if (Array.isArray(groupby)) {
    var l = getExprListSQL(groupby);
    clauses.push('GROUP BY ' + l.join(', '));
  }

  if (Array.isArray(orderby)) {
    var l = getExprListSQL(orderby);
    var cs = [];
    for (var i = 0; i < orderby.length; i++) {
      var o = orderby[i];
      str = exprToSQL(o.expr);
      str += ' ' + o.type;
      cs.push(str);
    }
    clauses.push('ORDER BY ' + cs.join(', '));
  }

  //TODO, use exprToSQL instead
  //limit is [number, number]
  if (Array.isArray(limit)) {
    if (options.offset !== false) {
      str = 'LIMIT ' + limit[0].value + ', ' + limit[1].value;
    } else {
      str = 'LIMIT ' + (limit[0].value + limit[1].value);
    }
    clauses.push(str);
  }

  return clauses.join(' ');
}

function updateToSQL(stmt, options) {
  var res = ['UPDATE'];

  options = options || {};
  if (options.keep_db === false) {
    res.push(stmt.table);
  } else {
    res.push(stmt.db + '.' + stmt.table);
  } 
  res.push('SET');

  var cs = [];
  var sets = stmt.set;
  var i, ele, str;
  for (i = 0; i < sets.length; i++) {
    str = sets[i].column + ' = ' + exprToSQL(sets[i].value);
    cs.push(str);
  }

  res.push(cs.join(', '));

  if (stmt.where && stmt.where != '') {
    str = 'WHERE '
    str += exprToSQL(stmt.where); 
    res.push(str);
  }
  return res.join(' ');
}

function replace_insertToSQL(stmt, options) {
  options = options || {};
  var res = [];
  res.push(stmt.type.toUpperCase());
  res.push('INTO')
  if (options.keep_db === false) {
    res.push(stmt.table);
  } else {
    res.push(stmt.db + '.' + stmt.table);
  }

  res.push('(' + stmt.columns.join(', ') + ')');
  res.push('VALUES')

  var i, ele, str;
  var cs = [];
  var vs = stmt.values;
  for (i = 0; i < vs.length; i++) {
    var es = vs[i].value;
    var rs = [];
    for (var j = 0; j < es.length; j++) {
      rs.push(exprToSQL(es[j])); 
    }
    cs.push('(' + rs.join(', ') + ')');
  }
  res.push(cs.join(', '));

  return res.join(' ');
}


exports.toSQL = function (stmt, options) {
  var res ;
  switch (stmt.type) {
    case  'select' :
      res = unionToSQL(stmt, options);
      break;
    case  'update' :
      res = updateToSQL(stmt, options);
      break;
    case  'insert' :
    case  'replace':
      res = replace_insertToSQL(stmt, options);
      break;
    case  'delete' :
      res = deleteToSQL(stmt, options);
      break;
    default :
      throw new Error('ERROR TYPE :' + stmt.type + ', NOT SUPPORTED');
  }
  return res;
}
