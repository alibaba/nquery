//var sqlparser = require('parser-robin');
var Parser  = require('../../lib/parser');
var Adapter = require('../../lib/adapter');


var NUM = 10000;

function debug(str) {
  console.log(str);  
}

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10));  
}

function test(fn, name) {
  var b = new Date();
  var res;
  for (var i = 0; i < NUM; i++) {
    ast = fn();  
  }
  var e = new Date();
  debug('-------------')
  debug('id : ' + name);
  debug('loop: ' + NUM + ', time: ' + (e-b));
  debug(Adapter.toSQL(ast)); 
  //inspect(res);
  debug('\n');
}

var sql = "SELECT C.brand_id AS mk,SUM(B.alipay_auction_num) AS f0 FROM myfox.dim_category AS A,myfox.rpt_brand_info_d AS B,myfox.dim_product_brand_hismap AS C,myfox.dim_brand AS D WHERE C.brand_id=D.brand_id AND B.category_id=C.category_id AND B.brand_id=C.org_brand_id AND A.category_id=B.category_id AND B.thedate>='2010-10-09' AND B.thedate<='2010-10-10' AND B.alipay_trade_amt>0 AND A.category_level1=16 AND A.leaf_flag=1 AND A.deleted=0 GROUP BY A.brand_name,B.brand_id ORDER BY SUM(B.alipay_trade_amt) DESC LIMIT 1500"; 


var sql_tpl = "SELECT C.brand_id AS mk,SUM(B.alipay_auction_num) AS f0 FROM myfox.dim_category AS A,myfox.rpt_brand_info_d AS B,myfox.dim_product_brand_hismap AS C,myfox.dim_brand AS D WHERE C.brand_id=D.brand_id AND B.category_id=C.category_id AND B.brand_id=C.org_brand_id AND A.category_id=B.category_id AND B.thedate>=:thedate_begin AND B.thedate<=:thedate_end AND B.alipay_trade_amt>0 AND A.category_level1=16 AND A.leaf_flag=1 AND A.deleted=0 GROUP BY A.brand_name,B.brand_id ORDER BY SUM(B.alipay_trade_amt) DESC LIMIT 1500"; 
//function oldTest() {
//  return sqlparser.parse(sql); 
//}

function parseTest() {
  return Parser.tplParse(sql); 
}

function tplParseTest() {
  return Parser.tplParse(sql_tpl, {
      thedate_begin : '2010-10-09',
      thedate_end   : '2010-10-10'
    }); 
}

function columnTest(){
  var sql = "select cf1:address_city_cnt, cf1:address_cnt, cf1:address_fullname_cnt, cf1:amt_alipay, cf1:coll_cnt, cf1:coll_days, cf1:coll_item_title, cf1:first_gmt_receive_pay, cf1:first_title, cf1:first_total_fee, cf1:love_seller_id, cf1:love_shop_name, cf1:love_shop_trade_cnt, cf1:max_gmt_receive_pay, cf1:max_long_days, cf1:max_long_gmt_receive_pay, cf1:max_long_last_gmt_receive_pay, cf1:max_title, cf1:max_total_fee, cf1:min_gmt_receive_pay, cf1:min_title, cf1:min_total_fee, cf1:num_alipay, cf1:peer_cnt, cf1:peer_for_cnt, cf1:peerpayername, cf1:time_line, cf1:user_order, cf1:user_regdate, cf1:user_star_name, cf1:user_tag, cf1:p_label from hbase_tcif.tcif_20121212 where row = 'bb9a63446090'"
  
  return Parser.tplParse(sql);
}

test(columnTest, 'column test');
test(parseTest, 'sql parse')
test(tplParseTest, 'sql tpl Parse')

test(parseTest, 'sql parse')
test(tplParseTest, 'sql tpl Parse')


