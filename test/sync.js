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
            list: [1, 2, 3]
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
        assert.deepEqual(diffResult.missing, 
            [
                {
                    key: 'title',
                    value: 'tttt'
                }, {
                    key: 'settings',
                    value: true,
                }, {
                    key: 'mail.list',
                    value: [1,2,3],
                }, {
                    key: 'mail.toolbar.value',
                    value: 1,
                }
            ], 'missing is not correct.');
    });
    it('extra', function() {
        assert.deepEqual(diffResult.extra,
            [
                {
                    key: 'title1',
                    value: 'tttt'
                }, {
                    key: 'mail.toolbar.color',
                    value: 'black',
                }
        ], 'extra is not correct.');    
    });
    it('generate file', function() {
        generate('test.js', json2, diffResult.missing, diffResult.extra);
    });
});
