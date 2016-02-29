/* */ 
(function(process) {
  var fs = require('fs'),
      path = require('path'),
      root = path.join(path.dirname(fs.realpathSync(__filename)), '..'),
      esprima = require('esprima'),
      escodegen = require(root),
      optionator = require('optionator')({
        prepend: 'Usage: escodegen [options] file...',
        options: [{
          option: 'config',
          alias: 'c',
          type: 'String',
          description: 'configuration json for escodegen'
        }]
      }),
      args = optionator.parse(process.argv),
      files = args._,
      options,
      esprimaOptions = {
        raw: true,
        tokens: true,
        range: true,
        comment: true
      };
  if (files.length === 0) {
    console.log(optionator.generateHelp());
    process.exit(1);
  }
  if (args.config) {
    try {
      options = JSON.parse(fs.readFileSync(args.config, 'utf-8'));
    } catch (err) {
      console.error('Error parsing config: ', err);
    }
  }
  files.forEach(function(filename) {
    var content = fs.readFileSync(filename, 'utf-8'),
        syntax = esprima.parse(content, esprimaOptions);
    if (options.comment) {
      escodegen.attachComments(syntax, syntax.comments, syntax.tokens);
    }
    console.log(escodegen.generate(syntax, options));
  });
})(require('process'));
