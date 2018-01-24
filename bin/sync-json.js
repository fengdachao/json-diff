var colorize, diff, fs, tty;

fs = require('fs');

tty = require('tty');

diff = require('../lib/index').diff;

colorize = require('../lib/colorize').colorize;

search = require('./creator').search;
generate = require('./creator').generate;

(function(argv) {
    var data1, data2, json1, json2, options, result;
    options = require('dreamopt')(["Usage: json-diff [-vjCk] first.json second.json", "Arguments:", "  first.json              Old file #var(file1) #required", "  second.json             New file #var(file2) #required", "General options:", "  -v, --verbose           Output progress info", "  -C, --[no-]color        Colored output", "  -j, --raw-json          Display raw JSON encoding of the diff #var(raw)", "  -k, --keys-only         Compare only the keys, ignore the differences in values #var(keysOnly)"], argv);
    if (options.verbose) {
      process.stderr.write((JSON.stringify(options, null, 2)) + "\n");
    }
    if (options.verbose) {
      process.stderr.write("Loading files...\n");
    }
    data1 = fs.readFileSync(options.file1, 'utf8');
    data2 = fs.readFileSync(options.file2, 'utf8');
    if (options.verbose) {
      process.stderr.write("Parsing old file...\n");
    }
    json1 = JSON.parse(data1);
    process.stderr.write("Parsing new file...\n");
    json2 = JSON.parse(data2);
    process.stderr.write("Running diff...\n");
    result = diff(json1, json2, options);
    if (options.color == null) {
      options.color = tty.isatty(process.stdout.fd);
    }
    if (result) {
      var creatorResult = search(result);
      process.stderr.write("Generate sync json file...\n");
      generate(options.file1, json2, creatorResult.missing, creatorResult.extra, result);      
    } else {
      if (options.verbose) {
        process.stderr.write("No diff");
      }
    }
    if (result) {
      return process.exit(1);
    }
  }).apply(this, process.argv.slice(2));
