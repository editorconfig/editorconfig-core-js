function Version(version) {
  var segments = (typeof version === "string") ? version.split(/\.\-/) : arguments;
  this.major = segments.length ? +segments[0] : 0;
  this.minor = segments.length > 1 ? +segments[1] : 0;
  this.build = segments.length > 2 ? +segments[2] : 0;
  this.configuration = segments.length > 3 ? segments[3] : "release";
}

Version.prototype = {
  toString: function() {
    return [this.major, this.minor, this.build].join(".") + "-" + this.configuration;
  },
  eq: function(version) {
    return version.major === this.major &&
      version.minor === this.minor &&
      version.build === this.build &&
      version.configuration === this.configuration;
  },
  gt: function(version) {
    return version.major > this.major &&
      version.minor > this.minor &&
      version.build > this.build;
  },
  gte: function(version){
    return version.major >= this.major &&
      version.minor >= this.minor &&
      version.build >= this.build;
  },
  lt: function(version) {
    return version.major < this.major &&
      version.minor < this.minor &&
      version.build < this.build;
  },
  lte: function(version){
    return version.major <= this.major &&
      version.minor <= this.minor &&
      version.build <= this.build;
  }
};

module.exports = Version;
