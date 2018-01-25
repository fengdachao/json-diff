var colorize, diff, fs, tty;

tty = require('tty');
fs = require('fs');

findRef = require('./creator').findLocaleRef;

(function(argv) {
    var options, result;
    options = require('dreamopt')([
      "Usage: find-localeref ",
      "Arguments:",
      "  dir source              Find Directory #var(dirPath) #required",
    ], argv);
    result = findRef(options.dirPath);
    // process.stderr.write(JSON.stringify(result));
    fs.writeFileSync('../result/ref.json', JSON.stringify(result, null, 2));
    if (result) {
      return process.exit(1);
    }
  }).apply(this, process.argv.slice(2));
