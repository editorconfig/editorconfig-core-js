var editorconfig = require('../');
var fs = require('fs');
var path = require('path');
var should = require('should');

describe('parse', function() {
  it('async', function() {
    var expected = {
      indent_style: 'tab',
      indent_size: 2,
      end_of_line: 'lf',
      charset: 'utf-8',
      trim_trailing_whitespace: true,
      insert_final_newline: true,
      tab_width: 2
    };
    var target = path.join(__dirname, '/app.js');
    var promise = editorconfig.parse(target);
    return promise.then(function onFulfilled(result) {
      expected.should.eql(result);
    });
  });

  it('sync', function() {
    var expected = {
      indent_style: 'tab',
      indent_size: 2,
      end_of_line: 'lf',
      charset: 'utf-8',
      trim_trailing_whitespace: true,
      insert_final_newline: true,
      tab_width: 2
    };
    var target = path.join(__dirname, '/app.js');
    expected.should.eql(editorconfig.parseSync(target));
  });
});
