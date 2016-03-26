var expect     = require('chai').expect(),
    injector   = require('./index');

injector({
  source: 'tests/index.html',
  basePaths: ['tests/_css', 'tests/_js']
});
