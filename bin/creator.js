(function() {
	var fs = require('fs');

	var missing = [], extra = [];

	function searchKey(data, pkey) {
		for(var key in data) {
			var val = data[key];
			if (typeof val === 'string') {
				if (key.indexOf('__deleted') !== -1) {
					missing.push(pkey + key.slice(0, -9))
				} else if (key.indexOf('__added') !== -1) {
					extra.push(pkey + key.slice(0, -7))
				}
			} else if (typeof val === 'object') {
				searchKey(val, pkey + key + '.')
			}
		}
	}

	function optionObject(data, opt, keyStr, value) {
		if (keyStr === '') return;
		var keys = keyStr.split('.');
		var key = keys[0],
			_data = data;
		for (var i = 0; i < keys.length - 1; i++) {
			key = keys[i];
			_data = _data[key];
		}
		if (opt === 'add') {
			_data[key] = value;
		} else {
			_data[key] = undefined;
		}
	}

	module.exports = {
		search: function(result) {
			searchKey(result, '')
			return {
				missing: missing,
				extra: extra
			}
		},
		generate: function(data, missing, extra) {
			for (var i = 0; i < missing.length; i++) {
				var key = missing[i];
				optionObject(data, 'add', key, 'NEED_APPEND');
			}
			for (var i = 0; i < extra.length; i++) {
				var key = extra[i];
				optionObject(data, 'remove', key);	
			}
			fs.writeFileSync('../result/generate.json', JSON.stringify(data));
			fs.writeFileSync('../result/append-result.json', JSON.stringify(missing))
			fs.writeFileSync('../result/remove-result.json', JSON.stringify(extra))
		}
	}
}).call(this)




