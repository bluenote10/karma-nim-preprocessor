var path = require('path');
var fs = require('fs');
var debounce = require('debounce');

// following approach from: https://github.com/jlmakes/karma-rollup-preprocessor/pull/11/files
var touchMain = function (file) {
  var now = new Date();
  fs.utimes(file, now, now, function() {});
}


var runCompiler = function(cmd, content, done, log) {
  var exec = require('child_process').exec;
  exec(cmd, function callback(error, stdout, stderr) {
    // log.info(error);
    // log.info(stdout);
    // log.info(stderr);
    if (error) {
      log.error("Compilation failed:\n" + error.message);
      //done(error, null);
    } else {
      log.info("Compilation successful:\n" + stdout);
      done(null, content);
    }
  });
};


var createNimPreprocessor = function (args, config, logger, helper) {
  var log = logger.create('preprocessor.nim')

  config = config || {}
  var defaultOptions = {
    bare: true,
    sourceMap: false,
    cmd: "nim js tests.nim"
  }
  var options = helper.merge(defaultOptions, args || {}, config || {})

  var transformPath = args.transformPath || config.transformPath || function (filepath) {
    return filepath.replace(/\.nim$/, '.js')
  }

  return function (content, file, done) {
    var result = null
    var map
    var datauri

    // Clear the screen before new compilation / test runs
    // This is stolen from: https://github.com/arthurc/karma-clear-screen-reporter/blob/master/index.js
    // console.log("\u001b[2J\u001b[0;0H");

    log.info("Observed change in: %s", file.originalPath);

    var cmd = options.cmd;
    log.info("Running: %s", cmd);

    // runCompiler(cmd, content, done, log);
    // done(null, content);

    var exec = require('child_process').exec;
    exec(cmd, function callback(error, stdout, stderr) {
      // log.info(error);
      // log.info(stdout);
      // log.info(stderr);
      if (error) {
        log.error("Compilation failed:\n" + error.message);
        // done(error, null);
      } else {
        log.info("Compilation successful:\n" + stdout);
        done(null, content);
      }
    });

    // log.info("Returning from compiler call.");
  }
}

createNimPreprocessor.$inject = ['args', 'config.nimPreprocessor', 'logger', 'helper']

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:nim': ['factory', createNimPreprocessor]
}
