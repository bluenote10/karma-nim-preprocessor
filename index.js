var path = require('path');
var fs = require('fs');

// following approach from: https://github.com/jlmakes/karma-rollup-preprocessor/pull/11/files
var touchMain = function (file) {
  var now = new Date();
  fs.utimes(file, now, now, function() {});
}

var createNimPreprocessor = function (args, config, logger, helper) {
  var log = logger.create('preprocessor.nim')

  config = config || {}
  var defaultOptions = {
    bare: true,
    sourceMap: false,
    main: null
  }
  var options = helper.merge(defaultOptions, args || {}, config || {})

  var transformPath = args.transformPath || config.transformPath || function (filepath) {
    return filepath.replace(/\.nim$/, '.js')
  }


  return function (content, file, done) {
    var result = null
    var map
    var datauri

    log.info('Processing "%s".', file.originalPath)

    // Hacky work-around until there is a solution to: https://github.com/karma-runner/karma/issues/2736
    // If there is an explicit entry point defined,
    // we check if it is identical to the requested
    // file. If so we do compile (it's the main entry
    // point). Otherwise we touch the main entry point
    // file, which will cause Karma to retrigger building
    // everythin.
    if (options.main) {
      // TODO: probably we have to incorporate basePath here... Karma docs don't help!
      var mainAbsPath = path.resolve(options.main);
      if (file.originalPath === mainAbsPath) {
        log.info("Compilation required: Yes");
      } else {
        log.info("Compilation required: No [touching main]");
        touchMain(mainAbsPath);
        //done(null, "");
        //return;
      }
    }

    file.path = transformPath(file.originalPath)
    log.info('Generating "%s".', file.path)

    var exec = require('child_process').exec;
    var cmd = 'nim js -o:"' + file.path + '" "' + file.originalPath + '"';
    log.info(cmd);
    exec(cmd, function callback(error, stdout, stderr) {
      // log.info(error);
      // log.info(stdout);
      // log.info(stderr);
      if (error) {
        log.error("Compilation failed:\n" + error.message);
        return done(error, null);
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
