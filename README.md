## nQuery

Generecic SQL engine for Web and Big-data.

## Install

```
npm install node-query
```

## Introduction

it could be used in some typical scenarios: 
  * As a sql Frontend , do syntax checking and formating.
  * As a SQL engine for your KV databass like hbase or anything like that.
  * Providing a SQL interface for your HTTP/WEB service.
  * Do data merging and intergration among many differecnt datasources like Oracle, MySQL, HBase etc. 


## Test & Demo

for test , type the command:

  ```
  make
  ```
to run demo, type the command:

  ```
    node demo/demo.js
  ```

read the demo carefully and then you could write own loader/adapter, 
there are also many test cases in `test/unit`, they would be great heleful to you.


## Usage

you could see the demo files `demo/demo.js`

for an KV Strorage engine ,what you need to do is providing the query interfaces like:
  *`singleQuery`, 
  *`rangeQuery`, 
  * `likeQuery`

for an SQL Strorage engine, you should realize a method like : 

  ```js
    function query(str, function(err, data) {
      ...  
    })
  ```

then you could write SQL like that : (code snippet  from `demo.js`)

```js
  var sqls = [
    "SELECT * FROM kv.user WHERE id IN ('01', '03')",
    "SELECT * FROM kv.user WHERE id LIKE '1%'",
    "SELECT type, MAX(age), COUNT(id) FROM kv.user WHERE id BETWEEN '03' AND '10' GROUP BY type ORDER BY MAX(age) DESC",
    "SELECT * from mysql.shop where shop_id > 5"
  ]

  var concurrentJoinSQL = [
    "$a := select * from kv.user where id BETWEEN '03' and '10'",
    "$b := select * from mysql.shop where shop_id > 5",
    "$c := select a.type , a.id ,b.name, b.title from $a INNER JOIN $b ON a.type = b.type WHERE a.id > '04'",
    "return $c"
  ]

  var sequentialJoinSQL = [
    "$a := select * from kv.user where id BETWEEN '03' and '10'",
    //you could also use `unique` do filter firstly
    //"$type := UNIQUE($a.type)",
    //"$b := select * from mysql.shop where type = $type",
    "$b := select * from mysql.shop where type in $a.type",
    "$c := select a.type , a.id ,b.name, b.title from $a INNER JOIN $b ON a.type = b.type WHERE a.id > '04'",
    "return [$b, $c]"
  ]
```

As you see ,besides as a SQL computation level built on top of KV storage engine,

it could do join operation among kv data-source, sql sources, HTTP services now

## nSQL Definition

The 'a little strange' sql you see above, nSQL realized a subset of SQL92, 
and it also have some procedure features, it supports variables, 
it addes type of `var` / `array` / `table`, and also keyword `return`, 
for the details, please see the specificationthe `peg/nquery.pgejs`. 


## Task Scheduling

As you could see in `concurrentJoinSQL` ,we know that the tasks `$a`, `$b` have no relations, 
so nQuery would do them concurrently,  but for the procedure of `sequentialJoinSQL`,  
`$b` is depending on `$a`,so task `$b` would be executed after the time `$a` completed 

== KeyWord `return` 

In traditional SQL, the query result is a 2-D table , but In nSQL , 
we add types of  `array` / `table`,so now you could return complicated results like 

```
  return [$b, $c, 'hello', [1, 2]];
```


Just Enjoy It!


## Acknowledgements

* PegJS     : http://pegjs.majda.cz/ 
* NodeJS    : http://nodejs.org/ 
* BigQuery  : https://developers.google.com/bigquery/docs/query-reference 
* PL/SQL    : http://docs.oracle.com/cd/B28359_01/appdev.111/b28370/fundamentals.htm#autoId0 
* MySQL     : http://dev.mysql.com/doc/refman/5.1/en/sql-syntax.html 
* Impala    : https://github.com/cloudera/impala/blob/master/fe/src/main/cup/sql-parser.y 
* PgSQL     : http://www.postgresql.org/docs/9.2/interactive/sql-syntax.html 
* ql.io     : http://ql.io

