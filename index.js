var path = require('path')

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

    log.debug('Processing "%s".', file.originalPath)
    file.path = transformPath(file.originalPath)

    try {
      // result = coffee.compile(content, opts)
      result = {};
      result.js = "console.log('hello world');";
    } catch (e) {
      log.error('%s\n  at %s:%d', e.message, file.originalPath, e.location.first_line)
      return done(e, null)
    }

    if (result.v3SourceMap) {
      map = JSON.parse(result.v3SourceMap)
      map.sources[0] = path.basename(file.originalPath)
      map.sourcesContent = [content]
      map.file = path.basename(file.path)
      file.sourceMap = map
      datauri = 'data:application/json;charset=utf-8;base64,' + new Buffer(JSON.stringify(map)).toString('base64')
      done(null, result.js + '\n//# sourceMappingURL=' + datauri + '\n')
    } else {
      done(null, result.js || result)
    }
  }
}

createNimPreprocessor.$inject = ['args', 'config.nimPreprocessor', 'logger', 'helper']

// PUBLISH DI MODULE
module.exports = {
  'preprocessor:nim': ['factory', createNimPreprocessor]
}
