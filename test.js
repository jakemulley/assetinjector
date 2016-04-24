var expect     = require('chai').expect(),
    injector   = require('./index');

injector({
  source: 'tests/expected.html',
  basePaths: ['tests/_css', 'tests/_js'],
  omit: 'tests'
});
