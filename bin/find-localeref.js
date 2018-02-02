var colorize, diff, fs, tty, generate, search;

tty = require('tty');
fs = require('fs');
generate = require('../lib/creator').generate;
findRef = require('../lib/creator').findLocaleRef;
diff = require('../lib/index').diff;
search = require('../lib/creator').search;

(function(argv) {
  var localeContent, options, refKeys, result, creatorResult;
  options = require('dreamopt')([
    "Usage: find-localeref ",
    "Arguments:",
    " Json file name          A valid locale json file #var(jsonFile) #required",
    " Dir source              Find Directory #var(dirPath) #required",
  ], argv);
  localeContent = fs.readFileSync(options.jsonFile);
  localeContent = JSON.parse(localeContent);
  refKeys = findRef(options.dirPath, true);
  result = diff(refKeys, localeContent, {keysOnly: true});
  creatorResult = search(result);
  fs.writeFileSync('result/ref.json', JSON.stringify(refKeys, null, 2));
  fs.writeFileSync('result/ref-diff.json', JSON.stringify(result, null, 2));
  generate('info.js', JSON.parse(JSON.stringify(refKeys)), creatorResult.missing, creatorResult.extra);
  
  if (result) {
    return process.exit(1);
  }
}).apply(this, process.argv.slice(2));
