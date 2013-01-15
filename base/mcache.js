// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

function debug(str){
  //console.log(str);  
}

module.exports = Cache;

function Cache(size) {
  this.size = size || 1000;
  this.stair = new Array(this.size);
  this.pos = 0;
  this.map = {};
}

Cache.prototype.get = function(key) {
  var pb = this.map[key];
  if (pb) {
    var pos = pb.pos;
    if (pos > 0) {
      var nkey = this.stair[pb.pos - 1];
      this.stair[pos] = nkey;
      this.stair[pos - 1] = key;
    }
    pb = pb.body 
  } 
  return pb;
}

Cache.prototype.set = function(key, value) {
  //remove the last ono
  if (this.pos >= this.size) {
    var k = this.stair[this.size -1]; 
    this.map[k] = undefined;
    this.pos = this.size -1;
  }
  this.map[key] = {
    body : value,
    pos  : this.pos
  }
  this.stair[this.pos] = key;
  return this.pos++;
}

Cache.prototype.top = function(n) {
  n = n || this.pos;
  return this.stair.slice(0, n);
}
