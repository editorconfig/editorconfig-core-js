var fs = require('fs');
var path = require('path');

var minimatch = require('./lib/fnmatch');
var iniparser = require('./lib/ini');
var Version = require('./lib/version');
var package = require('./package.json');


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

function processMatches(matches, version) {

  // Set indent_size to "tab" if indent_size is unspecified and
  // indent_style is set to "tab".
  if ("indent_style" in matches && matches.indent_style === "tab" &&
    !("indent_size" in matches) && version.gte(new Version(0, 10))) {
    matches["indent_size"] = "tab";
  }

  // Set tab_width to indent_size if indent_size is specified and
  // tab_width is unspecified
  if ("indent_size" in matches && !("tab_width" in matches) &&
    matches["indent_size"] !== "tab")
    matches["tab_width"] = matches["indent_size"];

  // Set indent_size to tab_width if indent_size is "tab"
  if("indent_size" in matches && "tab_width" in matches &&
    matches["indent_size"] === "tab")
    matches["indent_size"] = matches["tab_width"];

  return matches;
}

function getOptions(options) {
  if (typeof options === "undefined") {
    options = {};
  }
  switch (typeof options.version) {
    case "undefined":
      options.version = new Version(package.version);
      break;
    case "string":
      options.version = new Version(options.version);
      break;
  }
  return options;
}

module.exports.parse = function(filepath, options) {

  var filepaths = getConfigFileNames(path.dirname(filepath));
  var matchOptions = {matchBase: true, dot: true, noext: true};
  var configurations = [];
  var matches = {};

  var parsedOutput;
  options = getOptions(options);
  if (options.config) {
    if (fs.existsSync(options.config)) {
      parsedOutput = iniparser.parseSync(options.config);
      configurations.push([path.dirname(options.config), parsedOutput]);
    } else {
      throw Error("Invalid configuration path");
    }
  } else {
    for (var i in filepaths) {
      var configFilePath = filepaths[i];
      if (fs.existsSync(configFilePath)) {
        parsedOutput = iniparser.parseSync(configFilePath);
        configurations.push([path.dirname(configFilePath), parsedOutput]);
        if (parsedOutput.root == "true") break;
      }
    }
  }

  for (var j in configurations.reverse()) {
    var pathPrefix = configurations[j][0];
    var config = configurations[j][1];
    for (var glob in config) {
      var fullGlob = path.join(pathPrefix, "**/" + glob);
      if (minimatch(filepath, fullGlob, matchOptions)) {
        for (var k in config[glob]) {
          var value = config[glob][k].toLowerCase();
          try {
            value = JSON.parse(value);
          } catch(e){}
          matches[k] = value;
        }
      }
    }
  }

  return processMatches(matches, options.version);

};
