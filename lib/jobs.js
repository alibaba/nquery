// (C) 2011-2013 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

var Context  = require('./context');

exports.doSequential = doSequentialJobs;
exports.doConcurrent = doConcurrentTasks;

function doSequentialJobs(jobs, cb) {
  if (jobs.length == 0) {
    cb(null);
  }
  var count = 0;
  function jobCb(err) {
    count++;
    if (err) {
      cb(err);
    } else {
      if (count == jobs.length) {
        cb(null);
      } else {
        doNextJob();
      }
    } 
  }

  function doNextJob() {
    var job = jobs[count];
    doConcurrentTasks(job, jobCb)
  }

  doNextJob();
}

function doConcurrentTasks(tasks, cb) {
  if (!Array.isArray(tasks)) {
    tasks = [tasks];
  }

  var count = 0;
  var finished = false;
  function taskCb(err) {
    if (finished) {
      return;
    }
    count++;
    if (err) {
      finished = true;
      cb(err);
    } else {
      if (count == tasks.length) {
        finished = true;  
        cb(null);
      }
    }
  }

  for (var i = 0; i < tasks.length; i++) {
    var task = tasks[i];
    task.run(taskCb);
  }
}

