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

	function find(searchReg, dirPath) {
		var result = {},
			execResult = [],
			// /[{ ]t\('([a-zA-Z]+\.)*[A-Z_]+'\)/
			paths = fs.readdirSync(dirPath);
		for (var i = 0; i < paths.length; i++) {
			var p = dirPath + paths[i];
			if (fs.lstatSync(p).isFile()) {
				result[p] = [];
				var content = fs.readFileSync(p)
				while (execResult = searchReg.exec(content)) {
					result[p].push(execResult[0]);
				}
			} else {
				find(searchReg, p + '/');
			}
		}
		return result;
	}

	module.exports = {
		search: function(result) {
			searchKey(result, '')
			return {
				missing: missing,
				extra: extra
			}
		},
		findLocaleRef: function(dirPath) {
			return find(/[{ ]t\(['`]{1}[\S+\.]*[A-Z_]+['`]{1}\)/g, dirPath);
		},
		generate: function(fileName, data, missing, extra) {
			for (var i = 0; i < missing.length; i++) {
				var key = missing[i];
				optionObject(data, 'add', key, 'NEED_APPEND');
			}
			for (var i = 0; i < extra.length; i++) {
				var key = extra[i];
				optionObject(data, 'remove', key);	
			}
			var fileRegExp = /[a-zA-Z]+\.[a-z]+/;
			var newFileName = fileRegExp.exec(fileName)[0]
			fs.writeFileSync('../result/' + newFileName.replace(/\.[a-z]+/, '.json'), JSON.stringify(data));
			fs.writeFileSync('../result/' + newFileName.replace(/\.[a-z]+/, '-append.json'), JSON.stringify(missing))
			fs.writeFileSync('../result/' + newFileName.replace(/\.[a-z]+/, '-remove.json'), JSON.stringify(extra))
		}
	}
}).call(this)




