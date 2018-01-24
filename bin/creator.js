(function() {
	var TAB = '\t', ENTER = '\r\n';
	var fs = require('fs');

	var missing = [], extra = [];

	function isArray(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	}

	function isObject(obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	}

	function trimKeyOption(key) {
		return key.indexOf('__deleted') !== -1 ? key.slice(0, -9) : key.slice(0, -7);
	}

	function getObjectKeys(obj, pkey) {
		var result = [];
		for(var key in obj) {
			var val = obj[key];
			if (typeof val === 'string' || isArray(val)) {
				result.push(pkey + key);
			} else if(isObject(val)) {
				result = result.concat(getObjectKeys(val, pkey + key + '.'));
			}
		}
		return result;
	}
	
	function searchKey(data, pkey) {
		for(var key in data) {
			var val = data[key],
				optionKeys = [];

			if (key.indexOf('__deleted') !== -1 || key.indexOf('__added') !== -1) {
				if (typeof val === 'string') {
						optionKeys.push(pkey + trimKeyOption(key));
				} else if (isObject(val)) {
					optionKeys = optionKeys.concat(getObjectKeys(val, pkey + trimKeyOption(key) + '.'));
				}
				key.indexOf('__deleted') !== -1 ?
					missing = missing.concat(optionKeys) :
					extra = extra.concat(optionKeys);
			} else if (isObject(val)) {
				searchKey(val, pkey + key + '.');
			}

			// if (typeof val === 'string') {
			// 	if (key.indexOf('__deleted') !== -1) {
			// 		missing.push(pkey + key.slice(0, -9))
			// 	} else if (key.indexOf('__added') !== -1) {
			// 		extra.push(pkey + key.slice(0, -7))
			// 	}
			// } else if (typeof val === 'object') {
			// 	searchKey(val, pkey + key + '.')
			// }
		}
	}

	function optionObject(data, opt, keyStr, value) {
		if (keyStr === '') return;
		var keys = keyStr.split('.');
		var key = keys[0],
			_data = data;
		for (var i = 0; i < keys.length - 1; i++) {
			key = keys[i];
			if (_data[key] === undefined) _data[key] = {};
			_data = _data[key];
		}
		key = keys[i];
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

	function formatter(jsonData, indent) {
		var val = '', result = '';
		if (isObject(jsonData)) {
			result += '{' + ENTER;
			for(var key in jsonData) {
				val = jsonData[key];
				if (val === undefined) continue;
				result += indent + TAB + '"' + key + '" : ';
				if ( typeof val !== 'object' ) {
					val = val.replace(/"/g, '\'');
					result += '"' + val + '",' + ENTER;
				} else {
					result += formatter(val, indent + TAB + TAB);
				}
			}
			result = result.slice(0, -3) + ENTER;
			result += indent + '},' + ENTER;
		} else if (isArray(jsonData)) {
			result += '[' + ENTER;
			for(var index = 0; index < jsonData.length; index++) {
				val = jsonData[index];
				if ( typeof val !== 'object' ) {
					val = val.replace(/"/g, '\'');
					result += indent + TAB + '"' + val + '"';
					if (index === jsonData.length - 1) result += ENTER;
					else result += ',' + ENTER;
				} else {
					result += formatter(val, indent + TAB);
				}
			}
			result += indent + '],' + ENTER;
		} else {
			result += indent + jsonData;
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
		generate: function(fileName, data, missing, extra, diff) {
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
			var formatterJson = JSON.stringify(data, null, 2); //formatter = formatter(data, TAB, formatterJson);

			fs.writeFileSync('../result/' + newFileName.replace(/\.[a-z]+/, '.json'), formatterJson);
			fs.writeFileSync('../result/' + newFileName.replace(/\.[a-z]+/, '-append.json'), JSON.stringify(missing, null, 2));
			fs.writeFileSync('../result/' + newFileName.replace(/\.[a-z]+/, '-remove.json'), JSON.stringify(extra, null, 2));
			fs.writeFileSync('../result/' + newFileName.replace(/\.[a-z]+/, '-diff.json'), JSON.stringify(diff, null, 2));
		}
	}
}).call(this)




