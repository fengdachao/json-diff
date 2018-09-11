var TAB = '\t', ENTER = '\r\n';
var fs = require('fs');
var resultPath = './result/';

function isArray(obj) {
	return Object.prototype.toString.call(obj) === '[object Array]';
}

function isObject(obj) {
	return Object.prototype.toString.call(obj) === '[object Object]';
}

function trimKeyOption(key) {
	return key.indexOf('__deleted') !== -1 ? key.slice(0, -9) : key.slice(0, -7);
}

function isEmptyObject(obj) {
	return Object.keys(JSON.parse(JSON.stringify(obj))).length === 0;
}

function mapArray(a, key) {
	if (!a) return [];
	return a.map(function(item) {
		return item[key];
	})
}

function getObjectKeys(obj, pkey) {
	var result = [];
	for(var key in obj) {
		var val = obj[key];
		if (!isObject(val)) {// not object
			result.push({
				key: pkey + key,
				value: val,
			});
		} else {
			result = result.concat(getObjectKeys(val, pkey + key + '.'));
		}
	}
	return result;
}

function searchKey(data, pkey, missing, extra) {
	for(var key in data) {
		var val = data[key],
			optionKeys = [];

		if (key.indexOf('__deleted') !== -1 || key.indexOf('__added') !== -1) {
			if (!isObject(val)) {// except object
				optionKeys.push({
					key: pkey + trimKeyOption(key),
					value: val,
				});
			} else {
				optionKeys = optionKeys.concat(getObjectKeys(val, pkey + trimKeyOption(key) + '.'));
			}
			key.indexOf('__deleted') !== -1 ?
				Array.prototype.push.apply(missing, optionKeys) :
				Array.prototype.push.apply(extra, optionKeys);
		} else if (isObject(val)) {
			searchKey(val, pkey + key + '.', missing, extra);
		}
	}
}

function removeProperty(wholeData, keysArray) {
	if (keysArray.length === 0) return;
	var data = wholeData,
		i = 0,
		key,
		parent = wholeData;
	while(i < keysArray.length - 1) {
		key = keysArray[i];
		parent = data = data[key];
		i += 1;
	}
	key = keysArray[i]; // last key
	data = data[key];
	if (isEmptyObject(data)) {
		parent[key] = undefined;
		removeProperty(wholeData, keysArray.slice(0, -1));
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
		// all keys of _data is undefined, remove _data parent key from object
		removeProperty(data, keys.slice(0, -1));
	}
}

function find(searchReg, dirPath, result, allKeys) {
	var execResult = [],
		// /[{ ]t\('([a-zA-Z]+\.)*[A-Z_]+'\)/
		paths = fs.readdirSync(dirPath);
	for (var i = 0; i < paths.length; i++) {
		var p = dirPath + paths[i];
		if (fs.lstatSync(p).isFile()) {
			var content = fs.readFileSync(p)
			while (execResult = searchReg.exec(content)) {
				if (!result[p]) {
					result[p] = []
				}
				result[p].push(execResult[1]);
				allKeys.push(execResult[1]);
			}
		} else {
			find(searchReg, p + '/', result, allKeys);
		}
	}
}

module.exports = {
	search: function(result) {
		var missing = [], extra = [];
		searchKey(result, '', missing, extra);
		return {
			missing: missing,
			extra: extra
		}
	},
	findLocaleRef: function(dirPath, recordResult) {
		var findResult = {}, findKeys = [], localeKeyInRef = {};
		find(/[\s\(\{]t\(['`]{1}([\S+\.]*[A-Za-z_]+)['`]{1}\)/ig, dirPath, findResult, findKeys);
		if (recordResult) fs.writeFileSync(resultPath + '_refinfile.json', JSON.stringify(findResult, null, 2));
		// generate a obj
		for(var i = 0; i < findKeys.length; i++) {
			optionObject(localeKeyInRef, 'add', findKeys[i], 'TEMP_VALUE');
		}

		return localeKeyInRef;
	},
	generate: function(fileName, data, missing, extra) {
		var fileRegExp = /[a-zA-Z]+\.[a-z]+/;
		var newFileName = fileRegExp.exec(fileName)[0]
		var Prefix = `EN-${newFileName.split('.')[0]}:`
		for (var i = 0; i < missing.length; i++) {
			var key = missing[i].key,
				value = missing[i].value;
			// checking whether the value is array
			// if true we need wrap every item with EN-XX in array
			if (isArray(value)) {
				var arrayValue = value.map && value.map(function(item) {
					return Prefix + item
				}) || [];
				optionObject(data, 'add', key, arrayValue);
			} else {
				optionObject(data, 'add', key, Prefix + value);
			}
		}
		for (var i = 0; i < extra.length; i++) {
			var key = extra[i].key;
			optionObject(data, 'remove', key);
		}
		
		var formatterJson = JSON.stringify(data, null, 2);

		fs.writeFileSync(resultPath + newFileName.replace(/\.[a-z]+/, '.json'), formatterJson);
		fs.writeFileSync(resultPath + newFileName.replace(/\.[a-z]+/, '-append.json'), JSON.stringify(mapArray(missing, 'key'), null, 2));
		fs.writeFileSync(resultPath + newFileName.replace(/\.[a-z]+/, '-remove.json'), JSON.stringify(mapArray(extra, 'key'), null, 2));
	}
}