var assert = require('assert'),
    findRef = require('../lib/creator').findLocaleRef;

describe('find ref', function() {
  it('generate result', function() {
      findRef('../peridot/ux/src/', true);
  })
})