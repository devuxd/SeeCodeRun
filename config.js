System.config({
  defaultJSExtensions: true,
  transpiler: "babel",
  babelOptions: {
    "stage": 2,
    "optional": [
      "es7.decorators",
      "es7.classProperties"
    ]
  },
  paths: {
    "*": "./dist/*",
    "res": "./res/",
    "styles": "./styles/",
    "include": "./include/",
    "github:*": "jspm_packages/github/*",
    "npm:*": "jspm_packages/npm/*"
  },
  map: {
    "ansi-styles": "npm:ansi-styles@2.2.1",
    "aurelia-animator-css": "npm:aurelia-animator-css@1.0.0-beta.1.2.1",
    "aurelia-binding": "npm:aurelia-binding@1.0.0-beta.1.3.6",
    "aurelia-bootstrapper": "npm:aurelia-bootstrapper@1.0.0-beta.1.2.1",
    "aurelia-computed": "npm:aurelia-computed@0.9.1",
    "aurelia-event-aggregator": "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1",
    "aurelia-fetch-client": "npm:aurelia-fetch-client@1.0.0-beta.1.2.5",
    "aurelia-framework": "npm:aurelia-framework@1.0.0-beta.1.2.5",
    "aurelia-history-browser": "npm:aurelia-history-browser@1.0.0-beta.1.2.1",
    "aurelia-http-client": "npm:aurelia-http-client@1.0.0-beta.1.2.2",
    "aurelia-loader-default": "npm:aurelia-loader-default@1.0.0-beta.1.2.2",
    "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
    "aurelia-logging-console": "npm:aurelia-logging-console@1.0.0-beta.1.2.2",
    "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
    "aurelia-router": "npm:aurelia-router@1.0.0-beta.1.2.4",
    "aurelia-templating-binding": "npm:aurelia-templating-binding@1.0.0-beta.1.2.4",
    "aurelia-templating-resources": "npm:aurelia-templating-resources@1.0.0-beta.1.2.6",
    "aurelia-templating-router": "npm:aurelia-templating-router@1.0.0-beta.1.2.1",
    "babel": "npm:babel-core@5.8.38",
    "babel-core": "npm:babel-core@6.9.1",
    "babel-runtime": "npm:babel-runtime@5.8.38",
    "bootstrap": "github:twbs/bootstrap@3.3.6",
    "core-js": "npm:core-js@1.2.6",
    "d3": "npm:d3@3.5.17",
    "escodegen": "npm:escodegen@1.8.0",
    "esprima": "npm:esprima@2.7.2",
    "estraverse": "npm:estraverse@4.2.0",
    "esutils": "npm:esutils@2.0.2",
    "fetch": "github:github/fetch@0.10.1",
    "firebase": "npm:firebase@2.4.2",
    "font-awesome": "npm:font-awesome@4.6.3",
    "jquery": "npm:jquery@2.2.4",
    "jquery-ui": "github:components/jqueryui@1.11.4",
    "jqwidgets-framework": "npm:jqwidgets-framework@4.1.2",
    "jslinq": "npm:jslinq@1.0.15",
    "json": "github:systemjs/plugin-json@0.1.2",
    "md5": "npm:md5@2.1.0",
    "tarball": "npm:tarball@0.0.5",
    "text": "github:systemjs/plugin-text@0.0.3",
    "github:components/jqueryui@1.11.4": {
      "jquery": "npm:jquery@2.2.4"
    },
    "github:jspm/nodelibs-assert@0.1.0": {
      "assert": "npm:assert@1.4.1"
    },
    "github:jspm/nodelibs-buffer@0.1.0": {
      "buffer": "npm:buffer@3.6.0"
    },
    "github:jspm/nodelibs-constants@0.1.0": {
      "constants-browserify": "npm:constants-browserify@0.0.1"
    },
    "github:jspm/nodelibs-crypto@0.1.0": {
      "crypto-browserify": "npm:crypto-browserify@3.11.0"
    },
    "github:jspm/nodelibs-events@0.1.1": {
      "events": "npm:events@1.0.2"
    },
    "github:jspm/nodelibs-http@1.7.1": {
      "Base64": "npm:Base64@0.2.1",
      "events": "github:jspm/nodelibs-events@0.1.1",
      "inherits": "npm:inherits@2.0.1",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "url": "github:jspm/nodelibs-url@0.1.0",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "github:jspm/nodelibs-https@0.1.0": {
      "https-browserify": "npm:https-browserify@0.0.0"
    },
    "github:jspm/nodelibs-net@0.1.2": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "http": "github:jspm/nodelibs-http@1.7.1",
      "net": "github:jspm/nodelibs-net@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "timers": "github:jspm/nodelibs-timers@0.1.0",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "github:jspm/nodelibs-path@0.1.0": {
      "path-browserify": "npm:path-browserify@0.0.0"
    },
    "github:jspm/nodelibs-process@0.1.2": {
      "process": "npm:process@0.11.3"
    },
    "github:jspm/nodelibs-querystring@0.1.0": {
      "querystring": "npm:querystring@0.2.0"
    },
    "github:jspm/nodelibs-stream@0.1.0": {
      "stream-browserify": "npm:stream-browserify@1.0.0"
    },
    "github:jspm/nodelibs-string_decoder@0.1.0": {
      "string_decoder": "npm:string_decoder@0.10.31"
    },
    "github:jspm/nodelibs-timers@0.1.0": {
      "timers-browserify": "npm:timers-browserify@1.4.2"
    },
    "github:jspm/nodelibs-url@0.1.0": {
      "url": "npm:url@0.10.3"
    },
    "github:jspm/nodelibs-util@0.1.0": {
      "util": "npm:util@0.10.3"
    },
    "github:jspm/nodelibs-vm@0.1.0": {
      "vm-browserify": "npm:vm-browserify@0.0.4"
    },
    "github:jspm/nodelibs-zlib@0.1.0": {
      "browserify-zlib": "npm:browserify-zlib@0.1.4"
    },
    "github:twbs/bootstrap@3.3.6": {
      "jquery": "npm:jquery@2.2.4"
    },
    "npm:amdefine@1.0.0": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "module": "github:jspm/nodelibs-module@0.1.0",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:ansi-styles@2.2.1": {
      "color-convert": "npm:color-convert@1.0.0"
    },
    "npm:asn1.js@4.6.2": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "bn.js": "npm:bn.js@4.11.4",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "inherits": "npm:inherits@2.0.1",
      "minimalistic-assert": "npm:minimalistic-assert@1.0.0",
      "vm": "github:jspm/nodelibs-vm@0.1.0"
    },
    "npm:assert@1.4.1": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "util": "npm:util@0.10.3"
    },
    "npm:aurelia-animator-css@1.0.0-beta.1.2.1": {
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-templating": "npm:aurelia-templating@1.0.0-beta.1.2.7"
    },
    "npm:aurelia-binding@1.0.0-beta.1.3.6": {
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-task-queue": "npm:aurelia-task-queue@1.0.0-beta.1.2.1"
    },
    "npm:aurelia-bootstrapper@1.0.0-beta.1.2.1": {
      "aurelia-event-aggregator": "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1",
      "aurelia-framework": "npm:aurelia-framework@1.0.0-beta.1.2.5",
      "aurelia-history": "npm:aurelia-history@1.0.0-beta.1.2.1",
      "aurelia-history-browser": "npm:aurelia-history-browser@1.0.0-beta.1.2.1",
      "aurelia-loader-default": "npm:aurelia-loader-default@1.0.0-beta.1.2.2",
      "aurelia-logging-console": "npm:aurelia-logging-console@1.0.0-beta.1.2.2",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-pal-browser": "npm:aurelia-pal-browser@1.0.0-beta.2.0.1",
      "aurelia-polyfills": "npm:aurelia-polyfills@1.0.0-beta.1.1.6",
      "aurelia-router": "npm:aurelia-router@1.0.0-beta.1.2.4",
      "aurelia-templating": "npm:aurelia-templating@1.0.0-beta.1.2.7",
      "aurelia-templating-binding": "npm:aurelia-templating-binding@1.0.0-beta.1.2.4",
      "aurelia-templating-resources": "npm:aurelia-templating-resources@1.0.0-beta.1.2.6",
      "aurelia-templating-router": "npm:aurelia-templating-router@1.0.0-beta.1.2.1"
    },
    "npm:aurelia-computed@0.9.1": {
      "aurelia-binding": "npm:aurelia-binding@1.0.0-beta.1.3.6",
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1"
    },
    "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3": {
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1": {
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1"
    },
    "npm:aurelia-framework@1.0.0-beta.1.2.5": {
      "aurelia-binding": "npm:aurelia-binding@1.0.0-beta.1.3.6",
      "aurelia-dependency-injection": "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3",
      "aurelia-loader": "npm:aurelia-loader@1.0.0-beta.1.2.0",
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2",
      "aurelia-task-queue": "npm:aurelia-task-queue@1.0.0-beta.1.2.1",
      "aurelia-templating": "npm:aurelia-templating@1.0.0-beta.1.2.7"
    },
    "npm:aurelia-history-browser@1.0.0-beta.1.2.1": {
      "aurelia-history": "npm:aurelia-history@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-http-client@1.0.0-beta.1.2.2": {
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-loader-default@1.0.0-beta.1.2.2": {
      "aurelia-loader": "npm:aurelia-loader@1.0.0-beta.1.2.0",
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-loader@1.0.0-beta.1.2.0": {
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-logging-console@1.0.0-beta.1.2.2": {
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1"
    },
    "npm:aurelia-metadata@1.0.0-beta.1.2.1": {
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-pal-browser@1.0.0-beta.2.0.1": {
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-polyfills@1.0.0-beta.1.1.6": {
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1": {
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-router@1.0.0-beta.1.2.4": {
      "aurelia-dependency-injection": "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3",
      "aurelia-event-aggregator": "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1",
      "aurelia-history": "npm:aurelia-history@1.0.0-beta.1.2.1",
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2",
      "aurelia-route-recognizer": "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1"
    },
    "npm:aurelia-task-queue@1.0.0-beta.1.2.1": {
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2"
    },
    "npm:aurelia-templating-binding@1.0.0-beta.1.2.4": {
      "aurelia-binding": "npm:aurelia-binding@1.0.0-beta.1.3.6",
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-templating": "npm:aurelia-templating@1.0.0-beta.1.2.7"
    },
    "npm:aurelia-templating-resources@1.0.0-beta.1.2.6": {
      "aurelia-binding": "npm:aurelia-binding@1.0.0-beta.1.3.6",
      "aurelia-dependency-injection": "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3",
      "aurelia-loader": "npm:aurelia-loader@1.0.0-beta.1.2.0",
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2",
      "aurelia-task-queue": "npm:aurelia-task-queue@1.0.0-beta.1.2.1",
      "aurelia-templating": "npm:aurelia-templating@1.0.0-beta.1.2.7"
    },
    "npm:aurelia-templating-router@1.0.0-beta.1.2.1": {
      "aurelia-dependency-injection": "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3",
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2",
      "aurelia-router": "npm:aurelia-router@1.0.0-beta.1.2.4",
      "aurelia-templating": "npm:aurelia-templating@1.0.0-beta.1.2.7"
    },
    "npm:aurelia-templating@1.0.0-beta.1.2.7": {
      "aurelia-binding": "npm:aurelia-binding@1.0.0-beta.1.3.6",
      "aurelia-dependency-injection": "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3",
      "aurelia-loader": "npm:aurelia-loader@1.0.0-beta.1.2.0",
      "aurelia-logging": "npm:aurelia-logging@1.0.0-beta.1.2.1",
      "aurelia-metadata": "npm:aurelia-metadata@1.0.0-beta.1.2.1",
      "aurelia-pal": "npm:aurelia-pal@1.0.0-beta.1.2.2",
      "aurelia-path": "npm:aurelia-path@1.0.0-beta.1.2.2",
      "aurelia-task-queue": "npm:aurelia-task-queue@1.0.0-beta.1.2.1"
    },
    "npm:babel-code-frame@6.8.0": {
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "chalk": "npm:chalk@1.1.3",
      "esutils": "npm:esutils@2.0.2",
      "js-tokens": "npm:js-tokens@1.0.3"
    },
    "npm:babel-core@6.9.1": {
      "babel-code-frame": "npm:babel-code-frame@6.8.0",
      "babel-generator": "npm:babel-generator@6.9.0",
      "babel-helpers": "npm:babel-helpers@6.8.0",
      "babel-messages": "npm:babel-messages@6.8.0",
      "babel-register": "npm:babel-register@6.9.0",
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "babel-template": "npm:babel-template@6.9.0",
      "babel-traverse": "npm:babel-traverse@6.9.0",
      "babel-types": "npm:babel-types@6.9.1",
      "babylon": "npm:babylon@6.8.1",
      "convert-source-map": "npm:convert-source-map@1.2.0",
      "debug": "npm:debug@2.2.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "json5": "npm:json5@0.4.0",
      "lodash": "npm:lodash@4.13.1",
      "minimatch": "npm:minimatch@2.0.10",
      "module": "github:jspm/nodelibs-module@0.1.0",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "path-exists": "npm:path-exists@1.0.0",
      "path-is-absolute": "npm:path-is-absolute@1.0.0",
      "private": "npm:private@0.1.6",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "shebang-regex": "npm:shebang-regex@1.0.0",
      "slash": "npm:slash@1.0.0",
      "source-map": "npm:source-map@0.5.6",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:babel-generator@6.9.0": {
      "babel-messages": "npm:babel-messages@6.8.0",
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "babel-types": "npm:babel-types@6.9.1",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "detect-indent": "npm:detect-indent@3.0.1",
      "lodash": "npm:lodash@4.13.1",
      "source-map": "npm:source-map@0.5.6"
    },
    "npm:babel-helpers@6.8.0": {
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "babel-template": "npm:babel-template@6.9.0"
    },
    "npm:babel-messages@6.8.0": {
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:babel-register@6.9.0": {
      "babel-core": "npm:babel-core@6.9.1",
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "core-js": "npm:core-js@2.4.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "home-or-tmp": "npm:home-or-tmp@1.0.0",
      "lodash": "npm:lodash@4.13.1",
      "mkdirp": "npm:mkdirp@0.5.1",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "path-exists": "npm:path-exists@1.0.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "source-map-support": "npm:source-map-support@0.2.10"
    },
    "npm:babel-runtime@5.8.38": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:babel-runtime@6.9.2": {
      "core-js": "npm:core-js@2.4.0",
      "regenerator-runtime": "npm:regenerator-runtime@0.9.5"
    },
    "npm:babel-template@6.9.0": {
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "babel-traverse": "npm:babel-traverse@6.9.0",
      "babel-types": "npm:babel-types@6.9.1",
      "babylon": "npm:babylon@6.8.1",
      "lodash": "npm:lodash@4.13.1"
    },
    "npm:babel-traverse@6.9.0": {
      "babel-code-frame": "npm:babel-code-frame@6.8.0",
      "babel-messages": "npm:babel-messages@6.8.0",
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "babel-types": "npm:babel-types@6.9.1",
      "babylon": "npm:babylon@6.8.1",
      "debug": "npm:debug@2.2.0",
      "globals": "npm:globals@8.18.0",
      "invariant": "npm:invariant@2.2.1",
      "lodash": "npm:lodash@4.13.1",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:babel-types@6.9.1": {
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "babel-traverse": "npm:babel-traverse@6.9.0",
      "esutils": "npm:esutils@2.0.2",
      "lodash": "npm:lodash@4.13.1",
      "to-fast-properties": "npm:to-fast-properties@1.0.2"
    },
    "npm:babylon@6.8.1": {
      "babel-runtime": "npm:babel-runtime@6.9.2",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:block-stream@0.0.9": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "inherits": "npm:inherits@2.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0"
    },
    "npm:bn.js@4.11.4": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0"
    },
    "npm:brace-expansion@1.1.4": {
      "balanced-match": "npm:balanced-match@0.4.1",
      "concat-map": "npm:concat-map@0.0.1"
    },
    "npm:browserify-aes@1.0.6": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "buffer-xor": "npm:buffer-xor@1.0.3",
      "cipher-base": "npm:cipher-base@1.0.2",
      "create-hash": "npm:create-hash@1.1.2",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "inherits": "npm:inherits@2.0.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:browserify-cipher@1.0.0": {
      "browserify-aes": "npm:browserify-aes@1.0.6",
      "browserify-des": "npm:browserify-des@1.0.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "evp_bytestokey": "npm:evp_bytestokey@1.0.0"
    },
    "npm:browserify-des@1.0.0": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "cipher-base": "npm:cipher-base@1.0.2",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "des.js": "npm:des.js@1.0.0",
      "inherits": "npm:inherits@2.0.1"
    },
    "npm:browserify-rsa@4.0.1": {
      "bn.js": "npm:bn.js@4.11.4",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "constants": "github:jspm/nodelibs-constants@0.1.0",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "randombytes": "npm:randombytes@2.0.3"
    },
    "npm:browserify-sign@4.0.0": {
      "bn.js": "npm:bn.js@4.11.4",
      "browserify-rsa": "npm:browserify-rsa@4.0.1",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "create-hash": "npm:create-hash@1.1.2",
      "create-hmac": "npm:create-hmac@1.1.4",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "elliptic": "npm:elliptic@6.2.8",
      "inherits": "npm:inherits@2.0.1",
      "parse-asn1": "npm:parse-asn1@5.0.0",
      "stream": "github:jspm/nodelibs-stream@0.1.0"
    },
    "npm:browserify-zlib@0.1.4": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "pako": "npm:pako@0.2.8",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "readable-stream": "npm:readable-stream@2.1.4",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:buffer-shims@1.0.0": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0"
    },
    "npm:buffer-xor@1.0.3": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:buffer@3.6.0": {
      "base64-js": "npm:base64-js@0.0.8",
      "child_process": "github:jspm/nodelibs-child_process@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "ieee754": "npm:ieee754@1.1.6",
      "isarray": "npm:isarray@1.0.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:bufferjs@3.0.0": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0"
    },
    "npm:bufferstream@0.6.2": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "bufferjs": "npm:bufferjs@3.0.0",
      "buffertools": "npm:buffertools@2.1.4",
      "child_process": "github:jspm/nodelibs-child_process@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "http": "github:jspm/nodelibs-http@1.7.1",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:buffertools@2.1.4": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "events": "github:jspm/nodelibs-events@0.1.1",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:chalk@1.1.3": {
      "ansi-styles": "npm:ansi-styles@2.2.1",
      "escape-string-regexp": "npm:escape-string-regexp@1.0.5",
      "has-ansi": "npm:has-ansi@2.0.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "strip-ansi": "npm:strip-ansi@3.0.1",
      "supports-color": "npm:supports-color@2.0.0"
    },
    "npm:cipher-base@1.0.2": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "inherits": "npm:inherits@2.0.1",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "string_decoder": "github:jspm/nodelibs-string_decoder@0.1.0"
    },
    "npm:constants-browserify@0.0.1": {
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:convert-source-map@1.2.0": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0"
    },
    "npm:core-js@1.2.6": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:core-js@2.4.0": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:core-util-is@1.0.2": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0"
    },
    "npm:create-ecdh@4.0.0": {
      "bn.js": "npm:bn.js@4.11.4",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "elliptic": "npm:elliptic@6.2.8"
    },
    "npm:create-hash@1.1.2": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "cipher-base": "npm:cipher-base@1.0.2",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "inherits": "npm:inherits@2.0.1",
      "ripemd160": "npm:ripemd160@1.0.1",
      "sha.js": "npm:sha.js@2.4.5"
    },
    "npm:create-hmac@1.1.4": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "create-hash": "npm:create-hash@1.1.2",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "inherits": "npm:inherits@2.0.1",
      "stream": "github:jspm/nodelibs-stream@0.1.0"
    },
    "npm:crypto-browserify@3.11.0": {
      "browserify-cipher": "npm:browserify-cipher@1.0.0",
      "browserify-sign": "npm:browserify-sign@4.0.0",
      "create-ecdh": "npm:create-ecdh@4.0.0",
      "create-hash": "npm:create-hash@1.1.2",
      "create-hmac": "npm:create-hmac@1.1.4",
      "diffie-hellman": "npm:diffie-hellman@5.0.2",
      "inherits": "npm:inherits@2.0.1",
      "pbkdf2": "npm:pbkdf2@3.0.4",
      "public-encrypt": "npm:public-encrypt@4.0.0",
      "randombytes": "npm:randombytes@2.0.3"
    },
    "npm:debug@2.2.0": {
      "ms": "npm:ms@0.7.1"
    },
    "npm:des.js@1.0.0": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "inherits": "npm:inherits@2.0.1",
      "minimalistic-assert": "npm:minimalistic-assert@1.0.0"
    },
    "npm:detect-indent@3.0.1": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "get-stdin": "npm:get-stdin@4.0.1",
      "minimist": "npm:minimist@1.2.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "repeating": "npm:repeating@1.1.3",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:diffie-hellman@5.0.2": {
      "bn.js": "npm:bn.js@4.11.4",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "miller-rabin": "npm:miller-rabin@4.0.0",
      "randombytes": "npm:randombytes@2.0.3",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:elliptic@6.2.8": {
      "bn.js": "npm:bn.js@4.11.4",
      "brorand": "npm:brorand@1.0.5",
      "hash.js": "npm:hash.js@1.0.3",
      "inherits": "npm:inherits@2.0.1",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:escodegen@1.8.0": {
      "esprima": "npm:esprima@2.7.2",
      "estraverse": "npm:estraverse@1.9.3",
      "esutils": "npm:esutils@2.0.2",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "optionator": "npm:optionator@0.8.1",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "source-map": "npm:source-map@0.2.0",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:esprima@2.7.2": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:estraverse@4.2.0": {
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:evp_bytestokey@1.0.0": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "create-hash": "npm:create-hash@1.1.2",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0"
    },
    "npm:faye-websocket@0.11.0": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "http": "github:jspm/nodelibs-http@1.7.1",
      "https": "github:jspm/nodelibs-https@0.1.0",
      "net": "github:jspm/nodelibs-net@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "tls": "github:jspm/nodelibs-tls@0.1.0",
      "url": "github:jspm/nodelibs-url@0.1.0",
      "util": "github:jspm/nodelibs-util@0.1.0",
      "websocket-driver": "npm:websocket-driver@0.6.5"
    },
    "npm:firebase@2.4.2": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "faye-websocket": "npm:faye-websocket@0.11.0",
      "http": "github:jspm/nodelibs-http@1.7.1",
      "https": "github:jspm/nodelibs-https@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:font-awesome@4.6.3": {
      "css": "github:systemjs/plugin-css@0.1.22"
    },
    "npm:fstream@1.0.9": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "graceful-fs": "npm:graceful-fs@4.1.4",
      "inherits": "npm:inherits@2.0.1",
      "mkdirp": "npm:mkdirp@0.5.1",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "rimraf": "npm:rimraf@2.5.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0"
    },
    "npm:get-stdin@4.0.1": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:glob@7.0.3": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "events": "github:jspm/nodelibs-events@0.1.1",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "inflight": "npm:inflight@1.0.5",
      "inherits": "npm:inherits@2.0.1",
      "minimatch": "npm:minimatch@3.0.0",
      "once": "npm:once@1.3.3",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "path-is-absolute": "npm:path-is-absolute@1.0.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:globals@8.18.0": {
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:graceful-fs@4.1.4": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "constants": "github:jspm/nodelibs-constants@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:has-ansi@2.0.0": {
      "ansi-regex": "npm:ansi-regex@2.0.0"
    },
    "npm:hash.js@1.0.3": {
      "inherits": "npm:inherits@2.0.1"
    },
    "npm:home-or-tmp@1.0.0": {
      "os-tmpdir": "npm:os-tmpdir@1.0.1",
      "user-home": "npm:user-home@1.1.1"
    },
    "npm:https-browserify@0.0.0": {
      "http": "github:jspm/nodelibs-http@1.7.1"
    },
    "npm:inflight@1.0.5": {
      "once": "npm:once@1.3.3",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "wrappy": "npm:wrappy@1.0.2"
    },
    "npm:inherits@2.0.1": {
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:invariant@2.2.1": {
      "loose-envify": "npm:loose-envify@1.2.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:is-buffer@1.1.3": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0"
    },
    "npm:is-finite@1.0.1": {
      "number-is-nan": "npm:number-is-nan@1.0.0"
    },
    "npm:jqwidgets-framework@4.1.2": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:json5@0.4.0": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:levn@0.3.0": {
      "prelude-ls": "npm:prelude-ls@1.1.2",
      "type-check": "npm:type-check@0.3.2"
    },
    "npm:lodash@4.13.1": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:loose-envify@1.2.0": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "js-tokens": "npm:js-tokens@1.0.3",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:md5@2.1.0": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "charenc": "npm:charenc@0.0.1",
      "crypt": "npm:crypt@0.0.1",
      "is-buffer": "npm:is-buffer@1.1.3"
    },
    "npm:miller-rabin@4.0.0": {
      "bn.js": "npm:bn.js@4.11.4",
      "brorand": "npm:brorand@1.0.5"
    },
    "npm:minimatch@2.0.10": {
      "brace-expansion": "npm:brace-expansion@1.1.4",
      "path": "github:jspm/nodelibs-path@0.1.0"
    },
    "npm:minimatch@3.0.0": {
      "brace-expansion": "npm:brace-expansion@1.1.4",
      "path": "github:jspm/nodelibs-path@0.1.0"
    },
    "npm:mkdirp@0.5.1": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "minimist": "npm:minimist@0.0.8",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:once@1.3.3": {
      "wrappy": "npm:wrappy@1.0.2"
    },
    "npm:optionator@0.8.1": {
      "deep-is": "npm:deep-is@0.1.3",
      "fast-levenshtein": "npm:fast-levenshtein@1.1.3",
      "levn": "npm:levn@0.3.0",
      "prelude-ls": "npm:prelude-ls@1.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "type-check": "npm:type-check@0.3.2",
      "wordwrap": "npm:wordwrap@1.0.0"
    },
    "npm:os-tmpdir@1.0.1": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:pako@0.2.8": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:parse-asn1@5.0.0": {
      "asn1.js": "npm:asn1.js@4.6.2",
      "browserify-aes": "npm:browserify-aes@1.0.6",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "create-hash": "npm:create-hash@1.1.2",
      "evp_bytestokey": "npm:evp_bytestokey@1.0.0",
      "pbkdf2": "npm:pbkdf2@3.0.4",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:path-browserify@0.0.0": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:path-exists@1.0.0": {
      "fs": "github:jspm/nodelibs-fs@0.1.2"
    },
    "npm:path-is-absolute@1.0.0": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:pbkdf2@3.0.4": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "child_process": "github:jspm/nodelibs-child_process@0.1.0",
      "create-hmac": "npm:create-hmac@1.1.4",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:process-nextick-args@1.0.7": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:process@0.11.3": {
      "assert": "github:jspm/nodelibs-assert@0.1.0"
    },
    "npm:public-encrypt@4.0.0": {
      "bn.js": "npm:bn.js@4.11.4",
      "browserify-rsa": "npm:browserify-rsa@4.0.1",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "create-hash": "npm:create-hash@1.1.2",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "parse-asn1": "npm:parse-asn1@5.0.0",
      "randombytes": "npm:randombytes@2.0.3"
    },
    "npm:punycode@1.3.2": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:randombytes@2.0.3": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:readable-stream@1.1.14": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "core-util-is": "npm:core-util-is@1.0.2",
      "events": "github:jspm/nodelibs-events@0.1.1",
      "inherits": "npm:inherits@2.0.1",
      "isarray": "npm:isarray@0.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream-browserify": "npm:stream-browserify@1.0.0",
      "string_decoder": "npm:string_decoder@0.10.31"
    },
    "npm:readable-stream@2.1.4": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "buffer-shims": "npm:buffer-shims@1.0.0",
      "core-util-is": "npm:core-util-is@1.0.2",
      "events": "github:jspm/nodelibs-events@0.1.1",
      "inherits": "npm:inherits@2.0.1",
      "isarray": "npm:isarray@1.0.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "process-nextick-args": "npm:process-nextick-args@1.0.7",
      "string_decoder": "npm:string_decoder@0.10.31",
      "util-deprecate": "npm:util-deprecate@1.0.2"
    },
    "npm:regenerator-runtime@0.9.5": {
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:repeating@1.1.3": {
      "is-finite": "npm:is-finite@1.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:rimraf@2.5.2": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "glob": "npm:glob@7.0.3",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:ripemd160@1.0.1": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:sha.js@2.4.5": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "inherits": "npm:inherits@2.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:source-map-support@0.2.10": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "child_process": "github:jspm/nodelibs-child_process@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "http": "github:jspm/nodelibs-http@1.7.1",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "querystring": "github:jspm/nodelibs-querystring@0.1.0",
      "source-map": "npm:source-map@0.1.32"
    },
    "npm:source-map@0.1.32": {
      "amdefine": "npm:amdefine@1.0.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:source-map@0.2.0": {
      "amdefine": "npm:amdefine@1.0.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:source-map@0.5.6": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:stream-browserify@1.0.0": {
      "events": "github:jspm/nodelibs-events@0.1.1",
      "inherits": "npm:inherits@2.0.1",
      "readable-stream": "npm:readable-stream@1.1.14"
    },
    "npm:string_decoder@0.10.31": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0"
    },
    "npm:strip-ansi@3.0.1": {
      "ansi-regex": "npm:ansi-regex@2.0.0"
    },
    "npm:supports-color@2.0.0": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:tar@2.2.1": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "block-stream": "npm:block-stream@0.0.9",
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "fstream": "npm:fstream@1.0.9",
      "inherits": "npm:inherits@2.0.1",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:tarball@0.0.5": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "bufferstream": "npm:bufferstream@0.6.2",
      "events": "github:jspm/nodelibs-events@0.1.1",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "tar": "npm:tar@2.2.1",
      "zlib": "github:jspm/nodelibs-zlib@0.1.0"
    },
    "npm:timers-browserify@1.4.2": {
      "process": "npm:process@0.11.3"
    },
    "npm:type-check@0.3.2": {
      "prelude-ls": "npm:prelude-ls@1.1.2"
    },
    "npm:url@0.10.3": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "punycode": "npm:punycode@1.3.2",
      "querystring": "npm:querystring@0.2.0",
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:user-home@1.1.1": {
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.2"
    },
    "npm:util-deprecate@1.0.2": {
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:util@0.10.3": {
      "inherits": "npm:inherits@2.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:vm-browserify@0.0.4": {
      "indexof": "npm:indexof@0.0.1"
    },
    "npm:websocket-driver@0.6.5": {
      "buffer": "github:jspm/nodelibs-buffer@0.1.0",
      "crypto": "github:jspm/nodelibs-crypto@0.1.0",
      "events": "github:jspm/nodelibs-events@0.1.1",
      "net": "github:jspm/nodelibs-net@0.1.2",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "stream": "github:jspm/nodelibs-stream@0.1.0",
      "url": "github:jspm/nodelibs-url@0.1.0",
      "util": "github:jspm/nodelibs-util@0.1.0",
      "websocket-extensions": "npm:websocket-extensions@0.1.1"
    },
    "npm:websocket-extensions@0.1.1": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    }
  },
  bundles: {
    "aurelia-build-46e933966f.js": [
      "npm:aurelia-animator-css@1.0.0-beta.1.2.1.js",
      "npm:aurelia-animator-css@1.0.0-beta.1.2.1/aurelia-animator-css.js",
      "npm:aurelia-binding@1.0.0-beta.1.3.6.js",
      "npm:aurelia-binding@1.0.0-beta.1.3.6/aurelia-binding.js",
      "npm:aurelia-bootstrapper@1.0.0-beta.1.2.1.js",
      "npm:aurelia-bootstrapper@1.0.0-beta.1.2.1/aurelia-bootstrapper.js",
      "npm:aurelia-computed@0.9.1.js",
      "npm:aurelia-computed@0.9.1/aurelia-computed.js",
      "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3.js",
      "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3/aurelia-dependency-injection.js",
      "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1.js",
      "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1/aurelia-event-aggregator.js",
      "npm:aurelia-fetch-client@1.0.0-beta.1.2.5.js",
      "npm:aurelia-fetch-client@1.0.0-beta.1.2.5/aurelia-fetch-client.js",
      "npm:aurelia-framework@1.0.0-beta.1.2.5.js",
      "npm:aurelia-framework@1.0.0-beta.1.2.5/aurelia-framework.js",
      "npm:aurelia-history-browser@1.0.0-beta.1.2.1.js",
      "npm:aurelia-history-browser@1.0.0-beta.1.2.1/aurelia-history-browser.js",
      "npm:aurelia-history@1.0.0-beta.1.2.1.js",
      "npm:aurelia-history@1.0.0-beta.1.2.1/aurelia-history.js",
      "npm:aurelia-loader-default@1.0.0-beta.1.2.2.js",
      "npm:aurelia-loader-default@1.0.0-beta.1.2.2/aurelia-loader-default.js",
      "npm:aurelia-loader@1.0.0-beta.1.2.0.js",
      "npm:aurelia-loader@1.0.0-beta.1.2.0/aurelia-loader.js",
      "npm:aurelia-logging-console@1.0.0-beta.1.2.2.js",
      "npm:aurelia-logging-console@1.0.0-beta.1.2.2/aurelia-logging-console.js",
      "npm:aurelia-logging@1.0.0-beta.1.2.1.js",
      "npm:aurelia-logging@1.0.0-beta.1.2.1/aurelia-logging.js",
      "npm:aurelia-metadata@1.0.0-beta.1.2.1.js",
      "npm:aurelia-metadata@1.0.0-beta.1.2.1/aurelia-metadata.js",
      "npm:aurelia-pal-browser@1.0.0-beta.2.0.1.js",
      "npm:aurelia-pal-browser@1.0.0-beta.2.0.1/aurelia-pal-browser.js",
      "npm:aurelia-pal@1.0.0-beta.1.2.2.js",
      "npm:aurelia-pal@1.0.0-beta.1.2.2/aurelia-pal.js",
      "npm:aurelia-path@1.0.0-beta.1.2.2.js",
      "npm:aurelia-path@1.0.0-beta.1.2.2/aurelia-path.js",
      "npm:aurelia-polyfills@1.0.0-beta.1.1.6.js",
      "npm:aurelia-polyfills@1.0.0-beta.1.1.6/aurelia-polyfills.js",
      "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1.js",
      "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1/aurelia-route-recognizer.js",
      "npm:aurelia-router@1.0.0-beta.1.2.4.js",
      "npm:aurelia-router@1.0.0-beta.1.2.4/aurelia-router.js",
      "npm:aurelia-task-queue@1.0.0-beta.1.2.1.js",
      "npm:aurelia-task-queue@1.0.0-beta.1.2.1/aurelia-task-queue.js",
      "npm:aurelia-templating-binding@1.0.0-beta.1.2.4.js",
      "npm:aurelia-templating-binding@1.0.0-beta.1.2.4/aurelia-templating-binding.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/abstract-repeater.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/analyze-view-factory.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/array-repeat-strategy.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/aurelia-templating-resources.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/binding-mode-behaviors.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/binding-signaler.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/compile-spy.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/compose.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/css-resource.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/debounce-binding-behavior.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/dynamic-element.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/focus.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/hide.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/html-resource-plugin.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/html-sanitizer.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/if.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/map-repeat-strategy.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/null-repeat-strategy.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/number-repeat-strategy.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/repeat-strategy-locator.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/repeat-utilities.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/repeat.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/replaceable.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/sanitize-html.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/set-repeat-strategy.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/show.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/signal-binding-behavior.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/throttle-binding-behavior.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/update-trigger-binding-behavior.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/view-spy.js",
      "npm:aurelia-templating-resources@1.0.0-beta.1.2.6/with.js",
      "npm:aurelia-templating-router@1.0.0-beta.1.2.1.js",
      "npm:aurelia-templating-router@1.0.0-beta.1.2.1/aurelia-templating-router.js",
      "npm:aurelia-templating-router@1.0.0-beta.1.2.1/route-href.js",
      "npm:aurelia-templating-router@1.0.0-beta.1.2.1/route-loader.js",
      "npm:aurelia-templating-router@1.0.0-beta.1.2.1/router-view.js",
      "npm:aurelia-templating@1.0.0-beta.1.2.7.js",
      "npm:aurelia-templating@1.0.0-beta.1.2.7/aurelia-templating.js"
    ],
    "app-build-29cc057e05.js": [
      "app.html!github:systemjs/plugin-text@0.0.3.js",
      "app.js",
      "chat/chat.css!github:systemjs/plugin-text@0.0.3.js",
      "chat/chat.html!github:systemjs/plugin-text@0.0.3.js",
      "chat/chat.js",
      "consoleWindow/console-window.css!github:systemjs/plugin-text@0.0.3.js",
      "consoleWindow/console-window.html!github:systemjs/plugin-text@0.0.3.js",
      "consoleWindow/console-window.js",
      "cssEditor/css-editor.html!github:systemjs/plugin-text@0.0.3.js",
      "cssEditor/css-editor.js",
      "expressionSelection/expression-selection.js",
      "github:components/jqueryui@1.11.4.js",
      "github:components/jqueryui@1.11.4/jquery-ui.js",
      "github:jspm/nodelibs-buffer@0.1.0.js",
      "github:jspm/nodelibs-buffer@0.1.0/index.js",
      "github:jspm/nodelibs-path@0.1.0.js",
      "github:jspm/nodelibs-path@0.1.0/index.js",
      "github:jspm/nodelibs-process@0.1.2.js",
      "github:jspm/nodelibs-process@0.1.2/index.js",
      "github:twbs/bootstrap@3.3.6.js",
      "github:twbs/bootstrap@3.3.6/css/bootstrap.css!github:systemjs/plugin-text@0.0.3.js",
      "github:twbs/bootstrap@3.3.6/js/bootstrap.js",
      "historyViewer/history-viewer.html!github:systemjs/plugin-text@0.0.3.js",
      "historyViewer/history-viewer.js",
      "htmlEditor/html-editor.html!github:systemjs/plugin-text@0.0.3.js",
      "htmlEditor/html-editor.js",
      "htmlViewer/html-viewer.html!github:systemjs/plugin-text@0.0.3.js",
      "htmlViewer/html-viewer.js",
      "include/firepad-user-list.js",
      "jsEditor/js-editor.html!github:systemjs/plugin-text@0.0.3.js",
      "jsEditor/js-editor.js",
      "jsGutter/js-gutter.css!github:systemjs/plugin-text@0.0.3.js",
      "jsGutter/js-gutter.html!github:systemjs/plugin-text@0.0.3.js",
      "jsGutter/js-gutter.js",
      "layout/codeSection/code-section.css!github:systemjs/plugin-text@0.0.3.js",
      "layout/codeSection/code-section.html!github:systemjs/plugin-text@0.0.3.js",
      "layout/navigationBar/navigation-bar.css!github:systemjs/plugin-text@0.0.3.js",
      "layout/navigationBar/navigation-bar.html!github:systemjs/plugin-text@0.0.3.js",
      "layout/navigationBar/navigation-bar.js",
      "main.js",
      "mode-css.js",
      "mode-html.js",
      "mode-javascript.js",
      "npm:amdefine@1.0.0.js",
      "npm:amdefine@1.0.0/amdefine.js",
      "npm:aurelia-binding@1.0.0-beta.1.3.6.js",
      "npm:aurelia-binding@1.0.0-beta.1.3.6/aurelia-binding.js",
      "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3.js",
      "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3/aurelia-dependency-injection.js",
      "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1.js",
      "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1/aurelia-event-aggregator.js",
      "npm:aurelia-framework@1.0.0-beta.1.2.5.js",
      "npm:aurelia-framework@1.0.0-beta.1.2.5/aurelia-framework.js",
      "npm:aurelia-history@1.0.0-beta.1.2.1.js",
      "npm:aurelia-history@1.0.0-beta.1.2.1/aurelia-history.js",
      "npm:aurelia-loader@1.0.0-beta.1.2.0.js",
      "npm:aurelia-loader@1.0.0-beta.1.2.0/aurelia-loader.js",
      "npm:aurelia-logging@1.0.0-beta.1.2.1.js",
      "npm:aurelia-logging@1.0.0-beta.1.2.1/aurelia-logging.js",
      "npm:aurelia-metadata@1.0.0-beta.1.2.1.js",
      "npm:aurelia-metadata@1.0.0-beta.1.2.1/aurelia-metadata.js",
      "npm:aurelia-pal@1.0.0-beta.1.2.2.js",
      "npm:aurelia-pal@1.0.0-beta.1.2.2/aurelia-pal.js",
      "npm:aurelia-path@1.0.0-beta.1.2.2.js",
      "npm:aurelia-path@1.0.0-beta.1.2.2/aurelia-path.js",
      "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1.js",
      "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1/aurelia-route-recognizer.js",
      "npm:aurelia-router@1.0.0-beta.1.2.4.js",
      "npm:aurelia-router@1.0.0-beta.1.2.4/aurelia-router.js",
      "npm:aurelia-task-queue@1.0.0-beta.1.2.1.js",
      "npm:aurelia-task-queue@1.0.0-beta.1.2.1/aurelia-task-queue.js",
      "npm:aurelia-templating@1.0.0-beta.1.2.7.js",
      "npm:aurelia-templating@1.0.0-beta.1.2.7/aurelia-templating.js",
      "npm:base64-js@0.0.8.js",
      "npm:base64-js@0.0.8/lib/b64.js",
      "npm:buffer@3.6.0.js",
      "npm:buffer@3.6.0/index.js",
      "npm:charenc@0.0.1.js",
      "npm:charenc@0.0.1/charenc.js",
      "npm:crypt@0.0.1.js",
      "npm:crypt@0.0.1/crypt.js",
      "npm:d3@3.5.17.js",
      "npm:d3@3.5.17/d3.js",
      "npm:escodegen@1.8.0.js",
      "npm:escodegen@1.8.0/escodegen.js",
      "npm:escodegen@1.8.0/package.json!github:systemjs/plugin-json@0.1.2.js",
      "npm:esprima@2.7.2.js",
      "npm:esprima@2.7.2/esprima.js",
      "npm:estraverse@1.9.3.js",
      "npm:estraverse@1.9.3/estraverse.js",
      "npm:estraverse@4.2.0.js",
      "npm:estraverse@4.2.0/estraverse.js",
      "npm:estraverse@4.2.0/package.json!github:systemjs/plugin-json@0.1.2.js",
      "npm:esutils@2.0.2.js",
      "npm:esutils@2.0.2/lib/ast.js",
      "npm:esutils@2.0.2/lib/code.js",
      "npm:esutils@2.0.2/lib/keyword.js",
      "npm:esutils@2.0.2/lib/utils.js",
      "npm:ieee754@1.1.6.js",
      "npm:ieee754@1.1.6/index.js",
      "npm:is-buffer@1.1.3.js",
      "npm:is-buffer@1.1.3/index.js",
      "npm:isarray@1.0.0.js",
      "npm:isarray@1.0.0/index.js",
      "npm:jquery@2.2.4.js",
      "npm:jquery@2.2.4/dist/jquery.js",
      "npm:jslinq@1.0.15.js",
      "npm:jslinq@1.0.15/src/jslinq.js",
      "npm:md5@2.1.0.js",
      "npm:md5@2.1.0/md5.js",
      "npm:path-browserify@0.0.0.js",
      "npm:path-browserify@0.0.0/index.js",
      "npm:process@0.11.3.js",
      "npm:process@0.11.3/browser.js",
      "npm:source-map@0.2.0.js",
      "npm:source-map@0.2.0/lib/source-map.js",
      "npm:source-map@0.2.0/lib/source-map/array-set.js",
      "npm:source-map@0.2.0/lib/source-map/base64-vlq.js",
      "npm:source-map@0.2.0/lib/source-map/base64.js",
      "npm:source-map@0.2.0/lib/source-map/basic-source-map-consumer.js",
      "npm:source-map@0.2.0/lib/source-map/binary-search.js",
      "npm:source-map@0.2.0/lib/source-map/indexed-source-map-consumer.js",
      "npm:source-map@0.2.0/lib/source-map/mapping-list.js",
      "npm:source-map@0.2.0/lib/source-map/source-map-consumer.js",
      "npm:source-map@0.2.0/lib/source-map/source-map-generator.js",
      "npm:source-map@0.2.0/lib/source-map/source-node.js",
      "npm:source-map@0.2.0/lib/source-map/util.js",
      "pastebin/pastebin.css!github:systemjs/plugin-text@0.0.3.js",
      "pastebin/pastebin.html!github:systemjs/plugin-text@0.0.3.js",
      "pastebin/pastebin.js",
      "persistence/firebase-manager.js",
      "share/share-box.css!github:systemjs/plugin-text@0.0.3.js",
      "share/share-box.html!github:systemjs/plugin-text@0.0.3.js",
      "share/share-box.js",
      "theme-chrome.js",
      "tracePlay/play.html!github:systemjs/plugin-text@0.0.3.js",
      "tracePlay/play.js",
      "traceSearch/trace-search-history.js",
      "traceSearch/trace-search.html!github:systemjs/plugin-text@0.0.3.js",
      "traceSearch/trace-search.js",
      "traceService/es-analyzer.js",
      "traceService/es-instrumenter.js",
      "traceService/es-tracer.js",
      "traceService/external/auto-log-tracer.js",
      "traceService/external/esprima-node-factory.js",
      "traceService/trace-helper.js",
      "traceService/trace-model.js",
      "traceService/trace-query-manager.js",
      "traceService/trace-service.js",
      "traceService/trace.js",
      "traceView/trace-view-controller.js",
      "traceView/trace-view-model.js",
      "userList/user-list.html!github:systemjs/plugin-text@0.0.3.js",
      "userList/user-list.js",
      "utils/ace-utils.js",
      "utils/range.js",
      "visViewer/vis-viewer.html!github:systemjs/plugin-text@0.0.3.js",
      "visViewer/vis-viewer.js",
      "visualization/dataTable.js",
      "visualization/scatterPlot.js",
      "visualization/visualization.html!github:systemjs/plugin-text@0.0.3.js",
      "visualization/visualization.js",
      "visualization/visualizationFactory.js"
    ]
  },
  depCache: {
    "visViewer/vis-viewer.js": [
      "aurelia-event-aggregator",
      "aurelia-framework",
      "d3",
      "../visualization/visualizationFactory",
      "../visualization/visualization"
    ],
    "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1.js": [
      "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1/aurelia-event-aggregator"
    ],
    "npm:aurelia-framework@1.0.0-beta.1.2.5.js": [
      "npm:aurelia-framework@1.0.0-beta.1.2.5/aurelia-framework"
    ],
    "npm:d3@3.5.17.js": [
      "npm:d3@3.5.17/d3.js"
    ],
    "visualization/visualizationFactory.js": [
      "../visualization/dataTable",
      "../visualization/scatterPlot"
    ],
    "visualization/visualization.js": [
      "aurelia-framework",
      "d3",
      "../traceService/trace-model"
    ],
    "npm:aurelia-event-aggregator@1.0.0-beta.1.2.1/aurelia-event-aggregator.js": [
      "aurelia-logging"
    ],
    "npm:aurelia-framework@1.0.0-beta.1.2.5/aurelia-framework.js": [
      "aurelia-dependency-injection",
      "aurelia-binding",
      "aurelia-metadata",
      "aurelia-templating",
      "aurelia-loader",
      "aurelia-task-queue",
      "aurelia-path",
      "aurelia-pal",
      "aurelia-logging"
    ],
    "visualization/dataTable.js": [
      "d3"
    ],
    "visualization/scatterPlot.js": [
      "d3"
    ],
    "traceService/trace-model.js": [
      "./trace"
    ],
    "npm:aurelia-logging@1.0.0-beta.1.2.1.js": [
      "npm:aurelia-logging@1.0.0-beta.1.2.1/aurelia-logging"
    ],
    "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3.js": [
      "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3/aurelia-dependency-injection"
    ],
    "npm:aurelia-binding@1.0.0-beta.1.3.6.js": [
      "npm:aurelia-binding@1.0.0-beta.1.3.6/aurelia-binding"
    ],
    "npm:aurelia-metadata@1.0.0-beta.1.2.1.js": [
      "npm:aurelia-metadata@1.0.0-beta.1.2.1/aurelia-metadata"
    ],
    "npm:aurelia-templating@1.0.0-beta.1.2.7.js": [
      "npm:aurelia-templating@1.0.0-beta.1.2.7/aurelia-templating"
    ],
    "npm:aurelia-loader@1.0.0-beta.1.2.0.js": [
      "npm:aurelia-loader@1.0.0-beta.1.2.0/aurelia-loader"
    ],
    "npm:aurelia-task-queue@1.0.0-beta.1.2.1.js": [
      "npm:aurelia-task-queue@1.0.0-beta.1.2.1/aurelia-task-queue"
    ],
    "npm:aurelia-path@1.0.0-beta.1.2.2.js": [
      "npm:aurelia-path@1.0.0-beta.1.2.2/aurelia-path"
    ],
    "npm:aurelia-pal@1.0.0-beta.1.2.2.js": [
      "npm:aurelia-pal@1.0.0-beta.1.2.2/aurelia-pal"
    ],
    "npm:aurelia-dependency-injection@1.0.0-beta.1.2.3/aurelia-dependency-injection.js": [
      "aurelia-metadata",
      "aurelia-pal"
    ],
    "npm:aurelia-binding@1.0.0-beta.1.3.6/aurelia-binding.js": [
      "aurelia-logging",
      "aurelia-pal",
      "aurelia-task-queue",
      "aurelia-metadata"
    ],
    "npm:aurelia-metadata@1.0.0-beta.1.2.1/aurelia-metadata.js": [
      "aurelia-pal"
    ],
    "npm:aurelia-templating@1.0.0-beta.1.2.7/aurelia-templating.js": [
      "aurelia-logging",
      "aurelia-pal",
      "aurelia-metadata",
      "aurelia-path",
      "aurelia-loader",
      "aurelia-binding",
      "aurelia-dependency-injection",
      "aurelia-task-queue"
    ],
    "npm:aurelia-loader@1.0.0-beta.1.2.0/aurelia-loader.js": [
      "aurelia-path",
      "aurelia-metadata"
    ],
    "npm:aurelia-task-queue@1.0.0-beta.1.2.1/aurelia-task-queue.js": [
      "aurelia-pal"
    ],
    "userList/user-list.js": [
      "aurelia-framework",
      "jquery",
      "jquery-ui",
      "../../include/firepad-user-list"
    ],
    "npm:jquery@2.2.4.js": [
      "npm:jquery@2.2.4/dist/jquery.js"
    ],
    "github:components/jqueryui@1.11.4.js": [
      "github:components/jqueryui@1.11.4/jquery-ui.js"
    ],
    "github:components/jqueryui@1.11.4/jquery-ui.js": [
      "jquery"
    ],
    "traceView/trace-view-controller.js": [
      "jquery",
      "bootstrap",
      "./trace-view-model"
    ],
    "github:twbs/bootstrap@3.3.6.js": [
      "github:twbs/bootstrap@3.3.6/js/bootstrap"
    ],
    "github:twbs/bootstrap@3.3.6/js/bootstrap.js": [
      "jquery"
    ],
    "traceService/trace-service.js": [
      "./es-tracer"
    ],
    "traceService/es-tracer.js": [
      "./trace-helper",
      "./es-analyzer",
      "./es-instrumenter"
    ],
    "traceService/trace-helper.js": [
      "./trace-query-manager"
    ],
    "traceService/es-analyzer.js": [
      "esprima",
      "estraverse"
    ],
    "traceService/es-instrumenter.js": [
      "escodegen",
      "./external/esprima-node-factory",
      "./external/auto-log-tracer"
    ],
    "traceService/trace-query-manager.js": [
      "jslinq"
    ],
    "npm:esprima@2.7.2.js": [
      "npm:esprima@2.7.2/esprima.js"
    ],
    "npm:estraverse@4.2.0.js": [
      "npm:estraverse@4.2.0/estraverse.js"
    ],
    "npm:escodegen@1.8.0.js": [
      "npm:escodegen@1.8.0/escodegen.js"
    ],
    "traceService/external/auto-log-tracer.js": [
      "../trace-model"
    ],
    "npm:jslinq@1.0.15.js": [
      "npm:jslinq@1.0.15/src/jslinq.js"
    ],
    "npm:estraverse@4.2.0/estraverse.js": [
      "./package.json!systemjs-json"
    ],
    "npm:escodegen@1.8.0/escodegen.js": [
      "estraverse",
      "esutils",
      "source-map",
      "./package.json!systemjs-json"
    ],
    "npm:estraverse@1.9.3.js": [
      "npm:estraverse@1.9.3/estraverse.js"
    ],
    "npm:esutils@2.0.2.js": [
      "npm:esutils@2.0.2/lib/utils.js"
    ],
    "npm:source-map@0.2.0.js": [
      "npm:source-map@0.2.0/lib/source-map.js"
    ],
    "npm:esutils@2.0.2/lib/utils.js": [
      "./ast",
      "./code",
      "./keyword"
    ],
    "npm:source-map@0.2.0/lib/source-map.js": [
      "./source-map/source-map-generator",
      "./source-map/source-map-consumer",
      "./source-map/source-node"
    ],
    "npm:esutils@2.0.2/lib/keyword.js": [
      "./code"
    ],
    "npm:source-map@0.2.0/lib/source-map/source-map-generator.js": [
      "amdefine",
      "./base64-vlq",
      "./util",
      "./array-set",
      "./mapping-list"
    ],
    "npm:source-map@0.2.0/lib/source-map/source-map-consumer.js": [
      "amdefine",
      "./util",
      "./indexed-source-map-consumer",
      "./basic-source-map-consumer"
    ],
    "npm:source-map@0.2.0/lib/source-map/source-node.js": [
      "amdefine",
      "./source-map-generator",
      "./util",
      "process"
    ],
    "npm:amdefine@1.0.0.js": [
      "npm:amdefine@1.0.0/amdefine.js"
    ],
    "npm:source-map@0.2.0/lib/source-map/base64-vlq.js": [
      "amdefine",
      "./base64"
    ],
    "npm:source-map@0.2.0/lib/source-map/util.js": [
      "amdefine"
    ],
    "npm:source-map@0.2.0/lib/source-map/array-set.js": [
      "amdefine",
      "./util"
    ],
    "npm:source-map@0.2.0/lib/source-map/mapping-list.js": [
      "amdefine",
      "./util"
    ],
    "npm:source-map@0.2.0/lib/source-map/indexed-source-map-consumer.js": [
      "amdefine",
      "./util",
      "./binary-search",
      "./source-map-consumer",
      "./basic-source-map-consumer"
    ],
    "npm:source-map@0.2.0/lib/source-map/basic-source-map-consumer.js": [
      "amdefine",
      "./util",
      "./binary-search",
      "./array-set",
      "./base64-vlq",
      "./source-map-consumer"
    ],
    "github:jspm/nodelibs-process@0.1.2.js": [
      "github:jspm/nodelibs-process@0.1.2/index"
    ],
    "npm:amdefine@1.0.0/amdefine.js": [
      "path",
      "process"
    ],
    "npm:source-map@0.2.0/lib/source-map/base64.js": [
      "amdefine"
    ],
    "npm:source-map@0.2.0/lib/source-map/binary-search.js": [
      "amdefine"
    ],
    "github:jspm/nodelibs-process@0.1.2/index.js": [
      "process"
    ],
    "github:jspm/nodelibs-path@0.1.0.js": [
      "github:jspm/nodelibs-path@0.1.0/index"
    ],
    "npm:process@0.11.3.js": [
      "npm:process@0.11.3/browser.js"
    ],
    "github:jspm/nodelibs-path@0.1.0/index.js": [
      "path-browserify"
    ],
    "npm:path-browserify@0.0.0.js": [
      "npm:path-browserify@0.0.0/index.js"
    ],
    "npm:path-browserify@0.0.0/index.js": [
      "process"
    ],
    "share/share-box.js": [
      "aurelia-framework",
      "jquery",
      "jquery-ui"
    ],
    "pastebin/pastebin.js": [
      "aurelia-framework",
      "aurelia-event-aggregator",
      "aurelia-router",
      "../traceService/trace-model",
      "../utils/ace-utils",
      "../persistence/firebase-manager",
      "../layout/navigationBar/navigation-bar",
      "../htmlEditor/html-editor",
      "../cssEditor/css-editor",
      "../jsEditor/js-editor",
      "../jsGutter/js-gutter",
      "../htmlViewer/html-viewer",
      "../historyViewer/history-viewer",
      "../visViewer/vis-viewer",
      "../consoleWindow/console-window",
      "../traceView/trace-view-controller",
      "../expressionSelection/expression-selection",
      "../traceSearch/trace-search",
      "../traceSearch/trace-search-history",
      "../tracePlay/play",
      "jquery",
      "jquery-ui"
    ],
    "layout/navigationBar/navigation-bar.js": [
      "aurelia-framework",
      "../../userList/user-list",
      "../../share/share-box",
      "../../chat/chat"
    ],
    "htmlEditor/html-editor.js": [
      "../mode-html",
      "../theme-chrome"
    ],
    "cssEditor/css-editor.js": [
      "../mode-css",
      "../theme-chrome"
    ],
    "jsEditor/js-editor.js": [
      "../mode-javascript",
      "../theme-chrome",
      "md5"
    ],
    "htmlViewer/html-viewer.js": [
      "../traceService/trace-service"
    ],
    "chat/chat.js": [
      "aurelia-framework",
      "jquery",
      "jquery-ui"
    ],
    "npm:md5@2.1.0.js": [
      "npm:md5@2.1.0/md5.js"
    ],
    "npm:md5@2.1.0/md5.js": [
      "crypt",
      "charenc",
      "is-buffer"
    ],
    "npm:crypt@0.0.1.js": [
      "npm:crypt@0.0.1/crypt.js"
    ],
    "npm:charenc@0.0.1.js": [
      "npm:charenc@0.0.1/charenc.js"
    ],
    "npm:is-buffer@1.1.3.js": [
      "npm:is-buffer@1.1.3/index.js"
    ],
    "npm:is-buffer@1.1.3/index.js": [
      "buffer"
    ],
    "github:jspm/nodelibs-buffer@0.1.0.js": [
      "github:jspm/nodelibs-buffer@0.1.0/index"
    ],
    "github:jspm/nodelibs-buffer@0.1.0/index.js": [
      "buffer"
    ],
    "npm:buffer@3.6.0.js": [
      "npm:buffer@3.6.0/index.js"
    ],
    "npm:buffer@3.6.0/index.js": [
      "base64-js",
      "ieee754",
      "isarray"
    ],
    "npm:base64-js@0.0.8.js": [
      "npm:base64-js@0.0.8/lib/b64.js"
    ],
    "npm:ieee754@1.1.6.js": [
      "npm:ieee754@1.1.6/index.js"
    ],
    "npm:isarray@1.0.0.js": [
      "npm:isarray@1.0.0/index.js"
    ],
    "npm:aurelia-router@1.0.0-beta.1.2.4.js": [
      "npm:aurelia-router@1.0.0-beta.1.2.4/aurelia-router"
    ],
    "npm:aurelia-router@1.0.0-beta.1.2.4/aurelia-router.js": [
      "aurelia-logging",
      "aurelia-route-recognizer",
      "aurelia-dependency-injection",
      "aurelia-history",
      "aurelia-event-aggregator"
    ],
    "npm:aurelia-history@1.0.0-beta.1.2.1.js": [
      "npm:aurelia-history@1.0.0-beta.1.2.1/aurelia-history"
    ],
    "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1.js": [
      "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1/aurelia-route-recognizer"
    ],
    "npm:aurelia-route-recognizer@1.0.0-beta.1.2.1/aurelia-route-recognizer.js": [
      "aurelia-path"
    ],
    "main.js": [
      "jquery",
      "jquery-ui",
      "bootstrap"
    ]
  }
});