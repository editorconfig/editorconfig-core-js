var fs = require('fs');
var path = require('path');
var minimatch = require('./fnmatch');
var iniparser = require('./ini');

function getConfigFileNames(filepath) {
  var old_dirname = filepath;
  var dirname = old_dirname;
  var paths = [];
  do {
    paths.push(path.join(dirname, ".editorconfig"));
    old_dirname = dirname;
    dirname = path.dirname(old_dirname);
  } while(dirname != old_dirname);
  return paths;
}

module.exports.parse = function(filepath) {

  var filepaths = getConfigFileNames(path.dirname(filepath));
  var matchOptions = {matchBase: true, dot: true, noext: true};
  var configurations = [];
  var matches = {};

  for (var i in filepaths) {
    var configFilePath = filepaths[i];
    if (fs.existsSync(configFilePath)) {
      var parsedOutput = iniparser.parseSync(configFilePath);
      configurations.push([path.dirname(configFilePath), parsedOutput]);
      if (parsedOutput.root == "true") break;
    }
  }

  for (var j in configurations.reverse()) {
    var pathPrefix = configurations[j][0];
    var config = configurations[j][1];
    for (var glob in config) {
      var fullGlob = path.join(pathPrefix, "**/" + glob);
      if (minimatch(filepath, fullGlob, matchOptions)) {
        for (var k in config[glob]) {
          matches[k] = config[glob][k];
        }
      }
    }
  }

  return matches;

};
