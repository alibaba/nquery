
var should  = require('should');
var Adapter = require('../../lib/adapter');
var Parser  = require('../../lib/parser');
var Context = require('../../lib/context');

function debug(str) {
  console.log(str);  
}
function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('sql adapter test',function(){
  
  it('string escape test', function() {
    var sql, ast;

    sql = "SELECT 'single str' ,\"double string \", ' escape \\n \\t \\u0002'";
    ast = Parser.parse(sql);

    var estr = Adapter.toSQL(ast);
    estr.should.include('\\n');
    estr.should.include('\\t');
    //inspect(estr);
  });

  it('bool & paren test', function() {
    var sql, ast;

    sql = "SELECT (2 = true), (false = 0)";
    ast = Parser.parse(sql);

    var estr = Adapter.toSQL(ast);
    estr.should.eql('SELECT (2 = TRUE), (FALSE = 0)');
    //inspect(estr);
  });

  it('aggr function test', function() {
    var sql, ast;

    sql = "SELECT md5(a), COUNT(distinct a.id), COUNT(*)";
    ast = Parser.parse(sql);

    var estr = Adapter.toSQL(ast);
    estr.should.eql('SELECT md5(a), COUNT(DISTINCT a.id), COUNT(*)');
  });

  it('func test', function() {
    var sql, ast;

    sql = "SELECT md5(a), SUM(b) + 1";
    ast = Parser.parse(sql);

    var estr = Adapter.toSQL(ast);

    estr.should.eql('SELECT md5(a), SUM(b) + 1');
  });

  it('unary test', function() {
    var sql, ast;

    sql = "SELECT (NOT true), (!1) as test";
    ast = Parser.parse(sql);

    var estr = Adapter.toSQL(ast);
    //inspect(estr);
    //inspect(ast);

    estr.should.eql('SELECT (NOT TRUE), (NOT 1) AS test');
  });

  it('comparison test', function() {
    var sql, ast;
    sql =           "SELECT a fROM garuda_keykeys.keykeys wHERE type > 3 and id in (1, 2, 3) AND keywords CONTAINS (1,'str')"
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    //inspect(estr);
    estr.should.eql("SELECT a FROM garuda_keykeys.keykeys WHERE type > 3 AND id IN (1, 2, 3) AND keywords CONTAINS (1, 'str')");

    sql =           "SELECT a fROM t wHERE type >= 0 AND id between '1' AND 3 and it > 0 "
    ast = Parser.parse(sql);
    //inspect(ast);
    estr = Adapter.toSQL(ast);
    //inspect(estr);
    estr.should.eql("SELECT a FROM t WHERE type >= 0 AND id BETWEEN '1' AND 3 AND it > 0");
  });

  it('logical test', function() {
    var sql, ast;

    sql = "SELECT (1 > 1 AND 0 > 0 Or NOT true)";
    ast = Parser.parse(sql);

    var estr = Adapter.toSQL(ast);
    //inspect(estr);
    //inspect(ast);

    estr.should.eql('SELECT (1 > 1 AND 0 > 0 OR NOT TRUE)');
  });


  it('procedure test', function() {
    var sql, ast;

    sql = "SELECT * from t where id = $id or id NOT CONTAINS $tid";
    ast = Parser.parse(sql);

    Context.setctx({
      id : [1, 2, 'a'], 
      tid : ['b', 'c'], 
    })
    var estr = Adapter.toSQL(ast);
    //inspect(estr);
    //inspect(ast);
    estr.should.eql("SELECT * FROM t WHERE id IN (1, 2, 'a') OR id NOT CONTAINS ('b', 'c')");
  });

  it('clause test', function() {
    var sql, ast;

    sql = "SELECT DISTINCT da.id, SUM(da.score) from d.a da where d.c > 0 group by a.id order by sum(a.title) limit 0, 1";
    ast = Parser.parse(sql);

    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    //inspect(estr);

    estr.should.eql('SELECT DISTINCT da.id, SUM(da.score) FROM d.a AS da WHERE d.c > 0 GROUP BY a.id ORDER BY SUM(a.title) ASC LIMIT 0, 1');
  });

  it('join test', function() {
    var sql, ast;
    sql =           "SELECT a ,b.c FROM a ,b"
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    estr.should.eql("SELECT a, b.c FROM a, b");

    sql =           "SELECT a ,b.c FROM a LEFT join b on a.c = b.c"
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    estr.should.eql("SELECT a, b.c FROM a LEFT JOIN b ON a.c = b.c");
  });

  it('whole test', function(){
    var sql, ast, estr;
    sql =  "SELECT pt.brand_id AS id, bt.brand_name AS name, ht.org_brand_id AS originBrandId, SUM(pt.uid_uv) AS uv, dc.category_level2 AS level2 FROM myfox.dim_category AS dc INNER JOIN myfox.rpt_brand_info_d AS pt ON dc.category_id = pt.category_id INNER JOIN myfox.dim_product_brand_hismap AS ht ON pt.brand_id = ht.brand_id AND pt.category_id = ht.category_id INNER JOIN myfox.dim_brand AS bt ON bt.brand_id = ht.brand_id WHERE pt.brand_id NOT IN (-99, 0) AND dc.deleted = 0 AND bt.brand_name NOT LIKE 'other%' AND dc.category_level1 = '50013864' AND pt.thedate >= '2012-12-13' AND pt.thedate <= '2012-12-19' GROUP BY brand, brand_name ORDER BY SUM(pt.uid_uv) DESC LIMIT 0, 300"
    //sql =  'SELECT pt.brand_id AS id, bt.brand_name AS name, ht.org_brand_id AS originBrandId, SUM(pt.uid_uv) AS uv, dc.category_level2 AS level2 FROM myfox.dim_category AS dc INNER JOIN myfox.rpt_brand_info_d AS pt ON dc.category_id = pt.category_id INNER JOIN myfox.dim_product_brand_hismap AS ht ON pt.brand_id = ht.brand_id AND pt.category_id = ht.category_id INNER JOIN myfox.dim_brand AS bt ON bt.brand_id = ht.brand_id WHERE pt.brand_id NOT IN (-99,0) AND  dc.deleted = 0 AND bt.brand_name NOT like "other%" AND dc.category_level1 = "50013864" AND pt.thedate >= "2012-12-13" AND pt.thedate <= "2012-12-19" GROUP BY brand, brand_name ORDER BY SUM(pt.uid_uv) DESC LIMIT 0, 300 '
    ast = Parser.parse(sql);
    //inspect(ast.from);
    estr = Adapter.toSQL(ast);
    //debug(estr);
    estr.should.eql(sql);


    sql = "SELECT C.brand_id AS mk,SUM(B.alipay_auction_num) AS f0 FROM myfox.dim_category AS A,myfox.rpt_brand_info_d AS B,myfox.dim_product_brand_hismap AS C,myfox.dim_brand AS D WHERE C.brand_id=D.brand_id AND B.category_id=C.category_id AND B.brand_id=C.org_brand_id AND A.category_id=B.category_id AND B.thedate>='2010-10-09' AND B.thedate<='2010-10-10' AND B.alipay_trade_amt>0 AND A.category_level1=16 AND A.leaf_flag=1 AND A.deleted=0 GROUP BY A.brand_name,B.brand_id ORDER BY SUM(B.alipay_trade_amt) DESC LIMIT 1500"; 

    ast = Parser.parse(sql);
    //inspect(ast.from);
    estr = Adapter.toSQL(ast);
    //debug(estr);
    estr.should.eql("SELECT C.brand_id AS mk, SUM(B.alipay_auction_num) AS f0 FROM myfox.dim_category AS A, myfox.rpt_brand_info_d AS B, myfox.dim_product_brand_hismap AS C, myfox.dim_brand AS D WHERE C.brand_id = D.brand_id AND B.category_id = C.category_id AND B.brand_id = C.org_brand_id AND A.category_id = B.category_id AND B.thedate >= '2010-10-09' AND B.thedate <= '2010-10-10' AND B.alipay_trade_amt > 0 AND A.category_level1 = 16 AND A.leaf_flag = 1 AND A.deleted = 0 GROUP BY A.brand_name, B.brand_id ORDER BY SUM(B.alipay_trade_amt) DESC LIMIT 0, 1500"); 

    
    sql = "SELECT a.shop_id AS f30, a.shop_name AS f31, a.shop_star AS f32, a.shop_type AS f33, a.key_category1 AS catid, b.category_name AS catname,c.pict_url AS pict_url  FROM myfox.dim_clt_shops AS a LEFT JOIN myfox.dim_category AS b ON a.key_category1=b.category_id INNER JOIN isearch.shop AS c ON a.shop_id=c.id WHERE a.user_wangwang=windyrobin LIMIT 1";
    ast = Parser.parse(sql);
    //inspect(ast.from);
    estr = Adapter.toSQL(ast);
    estr.should.eql('SELECT a.shop_id AS f30, a.shop_name AS f31, a.shop_star AS f32, a.shop_type AS f33, a.key_category1 AS catid, b.category_name AS catname, c.pict_url AS pict_url FROM myfox.dim_clt_shops AS a LEFT JOIN myfox.dim_category AS b ON a.key_category1 = b.category_id INNER JOIN isearch.shop AS c ON a.shop_id = c.id WHERE a.user_wangwang = windyrobin LIMIT 0, 1');

  });

  it('if test', function() {
    var sql, ast;
    sql = 'SELECT IF(A.shop_type=2, \'0\', A.shop_star_level_id) AS mk, IF(A.shop_type=2,\'0\',B.shop_star_level_name) AS f0, SUM(A.alipay_trade_num) AS f1 FROM myfox.rpt_cat_info_shop_star_d AS A LEFT JOIN myfox.dim_shop_star_level AS B ON A.shop_star_level_id=B.shop_star_level_id WHERE A.category_id = "50012082" AND A.thedate >= "2010-10-01" AND A.thedate <= "2010-10-31" AND A.alipay_trade_num > 0 AND A.shop_type <> 2 AND B.shop_star_level_id > 0 GROUP BY A.shop_star_level_id ORDER BY A.shop_star_level_id ASC LIMIT 500'
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    estr.should.eql("SELECT IF(A.shop_type = 2, '0', A.shop_star_level_id) AS mk, IF(A.shop_type = 2, '0', B.shop_star_level_name) AS f0, SUM(A.alipay_trade_num) AS f1 FROM myfox.rpt_cat_info_shop_star_d AS A LEFT JOIN myfox.dim_shop_star_level AS B ON A.shop_star_level_id = B.shop_star_level_id WHERE A.category_id = '50012082' AND A.thedate >= '2010-10-01' AND A.thedate <= '2010-10-31' AND A.alipay_trade_num > 0 AND A.shop_type <> 2 AND B.shop_star_level_id > 0 GROUP BY A.shop_star_level_id ORDER BY A.shop_star_level_id ASC LIMIT 0, 500");
  });


  it('update test', function() {
    var sql, ast;
    sql = "UPDATE db.user_info SET last_login_time = '2012-12-18 12:44:21', last_login_ip = 'hohoo', login_count = login_count+1 WHERE id = 334094"
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    estr.should.eql("UPDATE db.user_info SET last_login_time = '2012-12-18 12:44:21', last_login_ip = 'hohoo', login_count = login_count + 1 WHERE id = 334094");
  });

  it('insert test', function() {
    var sql, ast;
    sql = "INSERT INTO cubemeta.meta_user_loginlog_trial (user_id, username, login_time, login_ip, login_url) VALUES ('uid1', 'use1', 'login', 'login_ip', 'login_url')";
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    //debug(estr);
    estr.should.eql("INSERT INTO cubemeta.meta_user_loginlog_trial (user_id, username, login_time, login_ip, login_url) VALUES ('uid1', 'use1', 'login', 'login_ip', 'login_url')");
  });

  it('replace test', function() {
    var sql, ast;
    sql = "REplace INTO a.b (c1, c2)VALUES('d', '2'), ('e',1), (TRUE, null)";
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    //debug(estr);
    estr.should.eql("REPLACE INTO a.b (c1, c2) VALUES ('d', '2'), ('e', 1), (TRUE, NULL)");
  });

  it('union test', function() {
    var sql, ast;
    sql = "select 1 union select '1' union select a union (select true)";
    ast = Parser.parse(sql);
    //inspect(ast);
    var estr = Adapter.toSQL(ast);
    //debug(estr);
    estr.should.eql("SELECT 1 UNION SELECT '1' UNION SELECT a UNION SELECT TRUE");
  });

});
