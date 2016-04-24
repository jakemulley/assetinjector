var expect     = require('chai').expect,
    injector   = require('./index'),
    fs         = require('fs');

var testFile = 'tests/index.html';
var expectedFile = 'tests/expected.html';

describe('AssetInjector', function() {

  before(function(done) {

    injector({
      source: testFile,
      basePaths: ['tests/_css', 'tests/_js'],
      omit: 'tests'
    });

    setTimeout(function() {
      done();
    }, 500);

  });

  it('should inject files correctly - compare against expected.html', function() {

    var testFileSource = fs.readFileSync(testFile);
    var expectedFileSource = fs.readFileSync(expectedFile);

    expect(testFileSource.toString()).to.equal(expectedFileSource.toString());

  });

});
