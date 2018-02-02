var assert = require('assert'),
    diff = require('../lib/index').diff,
    generate = require('../lib/creator').generate,
    search = require('../lib/creator').search,
    findRef = require('../lib/creator').findLocaleRef;
describe('sync json', function() {
    var json1 = {
        title: 'tttt',
        mail: {
            toolbar: {
                label: 'button1',
                value: 1,
            },
        },
        settings: true,
    };
    var json2 = {
        title1: 'tttt',
        mail: {
            toolbar: {
                label: 'button text',
                color: 'black',
            },
        },
    };
    var result = diff(json1, json2, {keysOnly: true});
    var diffResult = search(result);
    it('missing', function() {
        assert.deepEqual(diffResult.missing, ['title', 'settings', 'mail.toolbar.value'], 'missing is not correct.');
    });
    it('extra', function() {
        assert.deepEqual(diffResult.extra, ['title1', 'mail.toolbar.color'], 'extra is not correct.');    
    });
    it('generate file', function() {
        generate('test.js', json2, diffResult.missing, diffResult.extra);
    });
});
