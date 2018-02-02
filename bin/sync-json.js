var colorize, diff, fs, tty;

fs = require('fs');

tty = require('tty');

diff = require('../lib/index').diff;

colorize = require('../lib/colorize').colorize;

search = require('../lib/creator').search;
generate = require('../lib/creator').generate;

(function(argv) {
    var data1, data2, json1, json2, options, result;
    options = require('dreamopt')([
      "Usage: sync-json first.json second.json",
      "Arguments:",
      "  first.json              Standard json file #var(file1) #required",
      "  second.json             Compare json file #var(file2) #required",
    ], argv);
    options.keysOnly = true;
    data1 = fs.readFileSync(options.file1, 'utf8');
    data2 = fs.readFileSync(options.file2, 'utf8');
    process.stderr.write("Parsing old file...\n");
    json1 = JSON.parse(data1);
    process.stderr.write("Parsing new file...\n");
    json2 = JSON.parse(data2);
    process.stderr.write("Running diff...\n");
    result = diff(json1, json2, options);
    if (result) {
      var creatorResult = search(result);
      process.stderr.write("Generate sync json file...\n");
      fs.writeFileSync('result/diff.json', JSON.stringify(result, null, 2));
      generate(options.file2, json2, creatorResult.missing, creatorResult.extra);      
    } else {
      process.stderr.write("No diff");
    }
    if (result) {
      return process.exit(1);
    }
  }).apply(this, process.argv.slice(2));
