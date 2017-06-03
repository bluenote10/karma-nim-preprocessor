var path = require('path');
var fs = require('fs');

var createNimPreprocessor = function (args, config, logger, helper) {
  config = config || {}

  var log = logger.create('preprocessor.nim')
  var defaultOptions = {
    bare: true,
    sourceMap: false
  }
  var options = helper.merge(defaultOptions, args.options || {}, config.options || {})

  var transformPath = args.transformPath || config.transformPath || function (filepath) {
    return filepath.replace(/\.nim$/, '.js')
  }


  return function (content, file, done) {
    var result = null
    var map
    var datauri

    log.info('Processing "%s".', file.originalPath)
    file.path = transformPath(file.originalPath)
    log.info('Processing "%s".', file.path)

    var exec = require('child_process').exec;
    var cmd = 'nim js -o:"' + file.path + '" "' + file.originalPath + '"';
    log.info(cmd);
    exec(cmd, function callback(error, stdout, stderr) {
      // log.info(error);
      // log.info(stdout);
      // log.info(stderr);
      if (error) {
        log.error("Compilation failed:\n" + error.message);
        done(error, null);
      } else {
        log.info("Compilation successful.\n" + stdout);
        fs.readFile(file.path, 'utf8', function (error, data) {
          if (error) {
            log.error("Failed to read file:", file.path);
            done(error, null);
          } else {
            done(null, data);
          }
        });
      }
    });

  }
}

createNimPreprocessor.$inject = ['args', 'config.nimPreprocessor', 'logger', 'helper']

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:nim': ['factory', createNimPreprocessor]
}
