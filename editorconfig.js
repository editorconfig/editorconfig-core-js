var path = require('path');
var Promise = require('bluebird');
var whenReadFile = Promise.promisify(require('fs').readFile);

var minimatch = require('./lib/fnmatch');
var iniparser = require('./lib/ini');
var Version = require('./lib/version');
var pkg = require('./package.json');

var knownProps = [
  'end_of_line',
  'indent_style',
  'indent_size',
  'insert_final_newline',
  'trim_trailing_whitespace',
  'charset'
].reduce(function (set, prop) {
  set[prop] = true;
  return set;
}, {});

function fnmatch(filepath, glob) {
  var matchOptions = {matchBase: true, dot: true, noext: true};
  glob = glob.replace(/\*\*/g, '{*,**/**/**}');
  return minimatch(filepath, glob, matchOptions);
}

function getConfigFileNames(filepath, options) {
  var paths = [];
  do {
    filepath = path.dirname(filepath);
    paths.push(path.join(filepath, options.config));
  } while (filepath !== options.root && filepath !== path.dirname(filepath));
  return paths;
}

function processMatches(matches, version) {
  // Set indent_size to "tab" if indent_size is unspecified and
  // indent_style is set to "tab".
  if ("indent_style" in matches && matches.indent_style === "tab" &&
    !("indent_size" in matches) && version.gte(new Version(0, 10))) {
    matches.indent_size = "tab";
  }

  // Set tab_width to indent_size if indent_size is specified and
  // tab_width is unspecified
  if ("indent_size" in matches && !("tab_width" in matches) &&
  matches.indent_size !== "tab")
    matches.tab_width = matches.indent_size;

  // Set indent_size to tab_width if indent_size is "tab"
  if("indent_size" in matches && "tab_width" in matches &&
  matches.indent_size === "tab")
    matches.indent_size = matches.tab_width;

  return matches;
}

function processOptions(options) {
  options = options || {};
  return {
    config: options.config || '.editorconfig',
    version: new Version(options.version || pkg.version),
    root: path.resolve(options.root || '/')
  };
}

function parseFromFiles(filepath, files, options) {
  return getConfigsForFiles(files).then(function (configs) {
    return configs.reverse();
  }).reduce(function (matches, file) {
    var pathPrefix = path.dirname(file.name);
    file.contents.forEach(function (section) {
      var glob = section[0], options = section[1];
      if (!glob) return;
      switch (glob.indexOf('/')) {
        case -1: glob = "**/" + glob; break;
        case  0: glob = glob.substring(1); break;
      }
      var fullGlob = path.join(pathPrefix, glob);
      if (!fnmatch(filepath, fullGlob)) return;
      for (var key in options) {
        var value = options[key];
        key = key.toLowerCase();
        if (knownProps[key]) {
          value = value.toLowerCase();
        }
        try {
          value = JSON.parse(value);
        } catch(e) {}
        matches[key] = value;
      }
    });
    return matches;
  }, {}).then(function (matches) {
    return processMatches(matches, options.version);
  });
}

function StopReduce(array) {
  this.array = array;
}

StopReduce.prototype = Object.create(Error.prototype);

function getConfigsForFiles(files) {
  return Promise.reduce(files, function (configs, file) {
    var contents = iniparser.parseString(file.contents);
    configs.push({
      name: file.name,
      contents: contents
    });
    if ((contents[0][1].root || '').toLowerCase() === 'true') {
      return Promise.reject(new StopReduce(configs));
    }
    return configs;
  }, []).catch(StopReduce, function (stop) {
    return stop.array;
  });
}

function readConfigFiles(filepaths) {
  return Promise.map(filepaths, function (path) {
    return whenReadFile(path, 'utf-8').catch(function () {
      return '';
    }).then(function (contents) {
      return {name: path, contents: contents};
    });
  });
}

module.exports.parseFromFiles = function (filepath, files, options) {
  filepath = path.resolve(filepath);
  options = processOptions(options);
  return parseFromFiles(filepath, files, options);
};

module.exports.parse = function (filepath, options) {
  filepath = path.resolve(filepath);
  options = processOptions(options);
  var filepaths = getConfigFileNames(filepath, options);
  var files = readConfigFiles(filepaths);
  return parseFromFiles(filepath, files, options);
};
