System.register([], function (_export) {
    "use strict";

    "format global";
    return {
        setters: [],
        execute: function () {
            ace.define("ace/mode/doc_comment_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
                "use strict";

                var oop = require("../lib/oop");
                var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

                var DocCommentHighlightRules = function DocCommentHighlightRules() {
                    this.$rules = {
                        "start": [{
                            token: "comment.doc.tag",
                            regex: "@[\\w\\d_]+" }, DocCommentHighlightRules.getTagRule(), {
                            defaultToken: "comment.doc",
                            caseInsensitive: true
                        }]
                    };
                };

                oop.inherits(DocCommentHighlightRules, TextHighlightRules);

                DocCommentHighlightRules.getTagRule = function (start) {
                    return {
                        token: "comment.doc.tag.storage.type",
                        regex: "\\b(?:TODO|FIXME|XXX|HACK)\\b"
                    };
                };

                DocCommentHighlightRules.getStartRule = function (start) {
                    return {
                        token: "comment.doc",
                        regex: "\\/\\*(?=\\*)",
                        next: start
                    };
                };

                DocCommentHighlightRules.getEndRule = function (start) {
                    return {
                        token: "comment.doc",
                        regex: "\\*\\/",
                        next: start
                    };
                };

                exports.DocCommentHighlightRules = DocCommentHighlightRules;
            });

            ace.define("ace/mode/javascript_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/doc_comment_highlight_rules", "ace/mode/text_highlight_rules"], function (require, exports, module) {
                "use strict";

                var oop = require("../lib/oop");
                var DocCommentHighlightRules = require("./doc_comment_highlight_rules").DocCommentHighlightRules;
                var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
                var identifierRe = "[a-zA-Z\\$_¡-￿][a-zA-Z\\d\\$_¡-￿]*\\b";

                var JavaScriptHighlightRules = function JavaScriptHighlightRules(options) {
                    var keywordMapper = this.createKeywordMapper({
                        "variable.language": "Array|Boolean|Date|Function|Iterator|Number|Object|RegExp|String|Proxy|" + "Namespace|QName|XML|XMLList|" + "ArrayBuffer|Float32Array|Float64Array|Int16Array|Int32Array|Int8Array|" + "Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|" + "Error|EvalError|InternalError|RangeError|ReferenceError|StopIteration|" + "SyntaxError|TypeError|URIError|" + "decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|" + "isNaN|parseFloat|parseInt|" + "JSON|Math|" + "this|arguments|prototype|window|document",
                        "keyword": "const|yield|import|get|set|" + "break|case|catch|continue|default|delete|do|else|finally|for|function|" + "if|in|instanceof|new|return|switch|throw|try|typeof|let|var|while|with|debugger|" + "__parent__|__count__|escape|unescape|with|__proto__|" + "class|enum|extends|super|export|implements|private|public|interface|package|protected|static",
                        "storage.type": "const|let|var|function",
                        "constant.language": "null|Infinity|NaN|undefined",
                        "support.function": "alert",
                        "constant.language.boolean": "true|false"
                    }, "identifier");
                    var kwBeforeRe = "case|do|else|finally|in|instanceof|return|throw|try|typeof|yield|void";

                    var escapedRe = "\\\\(?:x[0-9a-fA-F]{2}|" + "u[0-9a-fA-F]{4}|" + "u{[0-9a-fA-F]{1,6}}|" + "[0-2][0-7]{0,2}|" + "3[0-7][0-7]?|" + "[4-7][0-7]?|" + ".)";

                    this.$rules = {
                        "no_regex": [DocCommentHighlightRules.getStartRule("doc-start"), comments("no_regex"), {
                            token: "string",
                            regex: "'(?=.)",
                            next: "qstring"
                        }, {
                            token: "string",
                            regex: '"(?=.)',
                            next: "qqstring"
                        }, {
                            token: "constant.numeric",
                            regex: /0(?:[xX][0-9a-fA-F]+|[bB][01]+)\b/
                        }, {
                            token: "constant.numeric",
                            regex: /[+-]?\d[\d_]*(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/
                        }, {
                            token: ["storage.type", "punctuation.operator", "support.function", "punctuation.operator", "entity.name.function", "text", "keyword.operator"],
                            regex: "(" + identifierRe + ")(\\.)(prototype)(\\.)(" + identifierRe + ")(\\s*)(=)",
                            next: "function_arguments"
                        }, {
                            token: ["storage.type", "punctuation.operator", "entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "paren.lparen"],
                            regex: "(" + identifierRe + ")(\\.)(" + identifierRe + ")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                            next: "function_arguments"
                        }, {
                            token: ["entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "paren.lparen"],
                            regex: "(" + identifierRe + ")(\\s*)(=)(\\s*)(function)(\\s*)(\\()",
                            next: "function_arguments"
                        }, {
                            token: ["storage.type", "punctuation.operator", "entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "entity.name.function", "text", "paren.lparen"],
                            regex: "(" + identifierRe + ")(\\.)(" + identifierRe + ")(\\s*)(=)(\\s*)(function)(\\s+)(\\w+)(\\s*)(\\()",
                            next: "function_arguments"
                        }, {
                            token: ["storage.type", "text", "entity.name.function", "text", "paren.lparen"],
                            regex: "(function)(\\s+)(" + identifierRe + ")(\\s*)(\\()",
                            next: "function_arguments"
                        }, {
                            token: ["entity.name.function", "text", "punctuation.operator", "text", "storage.type", "text", "paren.lparen"],
                            regex: "(" + identifierRe + ")(\\s*)(:)(\\s*)(function)(\\s*)(\\()",
                            next: "function_arguments"
                        }, {
                            token: ["text", "text", "storage.type", "text", "paren.lparen"],
                            regex: "(:)(\\s*)(function)(\\s*)(\\()",
                            next: "function_arguments"
                        }, {
                            token: "keyword",
                            regex: "(?:" + kwBeforeRe + ")\\b",
                            next: "start"
                        }, {
                            token: ["support.constant"],
                            regex: /that\b/
                        }, {
                            token: ["storage.type", "punctuation.operator", "support.function.firebug"],
                            regex: /(console)(\.)(warn|info|log|error|time|trace|timeEnd|assert)\b/
                        }, {
                            token: keywordMapper,
                            regex: identifierRe
                        }, {
                            token: "punctuation.operator",
                            regex: /[.](?![.])/,
                            next: "property"
                        }, {
                            token: "keyword.operator",
                            regex: /--|\+\+|\.{3}|===|==|=|!=|!==|<+=?|>+=?|!|&&|\|\||\?\:|[!$%&*+\-~\/^]=?/,
                            next: "start"
                        }, {
                            token: "punctuation.operator",
                            regex: /[?:,;.]/,
                            next: "start"
                        }, {
                            token: "paren.lparen",
                            regex: /[\[({]/,
                            next: "start"
                        }, {
                            token: "paren.rparen",
                            regex: /[\])}]/
                        }, {
                            token: "comment",
                            regex: /^#!.*$/
                        }],
                        property: [{
                            token: "text",
                            regex: "\\s+"
                        }, {
                            token: ["storage.type", "punctuation.operator", "entity.name.function", "text", "keyword.operator", "text", "storage.type", "text", "entity.name.function", "text", "paren.lparen"],
                            regex: "(" + identifierRe + ")(\\.)(" + identifierRe + ")(\\s*)(=)(\\s*)(function)(?:(\\s+)(\\w+))?(\\s*)(\\()",
                            next: "function_arguments"
                        }, {
                            token: "punctuation.operator",
                            regex: /[.](?![.])/
                        }, {
                            token: "support.function",
                            regex: /(s(?:h(?:ift|ow(?:Mod(?:elessDialog|alDialog)|Help))|croll(?:X|By(?:Pages|Lines)?|Y|To)?|t(?:op|rike)|i(?:n|zeToContent|debar|gnText)|ort|u(?:p|b(?:str(?:ing)?)?)|pli(?:ce|t)|e(?:nd|t(?:Re(?:sizable|questHeader)|M(?:i(?:nutes|lliseconds)|onth)|Seconds|Ho(?:tKeys|urs)|Year|Cursor|Time(?:out)?|Interval|ZOptions|Date|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Date|FullYear)|FullYear|Active)|arch)|qrt|lice|avePreferences|mall)|h(?:ome|andleEvent)|navigate|c(?:har(?:CodeAt|At)|o(?:s|n(?:cat|textual|firm)|mpile)|eil|lear(?:Timeout|Interval)?|a(?:ptureEvents|ll)|reate(?:StyleSheet|Popup|EventObject))|t(?:o(?:GMTString|S(?:tring|ource)|U(?:TCString|pperCase)|Lo(?:caleString|werCase))|est|a(?:n|int(?:Enabled)?))|i(?:s(?:NaN|Finite)|ndexOf|talics)|d(?:isableExternalCapture|ump|etachEvent)|u(?:n(?:shift|taint|escape|watch)|pdateCommands)|j(?:oin|avaEnabled)|p(?:o(?:p|w)|ush|lugins.refresh|a(?:ddings|rse(?:Int|Float)?)|r(?:int|ompt|eference))|e(?:scape|nableExternalCapture|val|lementFromPoint|x(?:p|ec(?:Script|Command)?))|valueOf|UTC|queryCommand(?:State|Indeterm|Enabled|Value)|f(?:i(?:nd|le(?:ModifiedDate|Size|CreatedDate|UpdatedDate)|xed)|o(?:nt(?:size|color)|rward)|loor|romCharCode)|watch|l(?:ink|o(?:ad|g)|astIndexOf)|a(?:sin|nchor|cos|t(?:tachEvent|ob|an(?:2)?)|pply|lert|b(?:s|ort))|r(?:ou(?:nd|teEvents)|e(?:size(?:By|To)|calc|turnValue|place|verse|l(?:oad|ease(?:Capture|Events)))|andom)|g(?:o|et(?:ResponseHeader|M(?:i(?:nutes|lliseconds)|onth)|Se(?:conds|lection)|Hours|Year|Time(?:zoneOffset)?|Da(?:y|te)|UTC(?:M(?:i(?:nutes|lliseconds)|onth)|Seconds|Hours|Da(?:y|te)|FullYear)|FullYear|A(?:ttention|llResponseHeaders)))|m(?:in|ove(?:B(?:y|elow)|To(?:Absolute)?|Above)|ergeAttributes|a(?:tch|rgins|x))|b(?:toa|ig|o(?:ld|rderWidths)|link|ack))\b(?=\()/
                        }, {
                            token: "support.function.dom",
                            regex: /(s(?:ub(?:stringData|mit)|plitText|e(?:t(?:NamedItem|Attribute(?:Node)?)|lect))|has(?:ChildNodes|Feature)|namedItem|c(?:l(?:ick|o(?:se|neNode))|reate(?:C(?:omment|DATASection|aption)|T(?:Head|extNode|Foot)|DocumentFragment|ProcessingInstruction|E(?:ntityReference|lement)|Attribute))|tabIndex|i(?:nsert(?:Row|Before|Cell|Data)|tem)|open|delete(?:Row|C(?:ell|aption)|T(?:Head|Foot)|Data)|focus|write(?:ln)?|a(?:dd|ppend(?:Child|Data))|re(?:set|place(?:Child|Data)|move(?:NamedItem|Child|Attribute(?:Node)?)?)|get(?:NamedItem|Element(?:sBy(?:Name|TagName|ClassName)|ById)|Attribute(?:Node)?)|blur)\b(?=\()/
                        }, {
                            token: "support.constant",
                            regex: /(s(?:ystemLanguage|cr(?:ipts|ollbars|een(?:X|Y|Top|Left))|t(?:yle(?:Sheets)?|atus(?:Text|bar)?)|ibling(?:Below|Above)|ource|uffixes|e(?:curity(?:Policy)?|l(?:ection|f)))|h(?:istory|ost(?:name)?|as(?:h|Focus))|y|X(?:MLDocument|SLDocument)|n(?:ext|ame(?:space(?:s|URI)|Prop))|M(?:IN_VALUE|AX_VALUE)|c(?:haracterSet|o(?:n(?:structor|trollers)|okieEnabled|lorDepth|mp(?:onents|lete))|urrent|puClass|l(?:i(?:p(?:boardData)?|entInformation)|osed|asses)|alle(?:e|r)|rypto)|t(?:o(?:olbar|p)|ext(?:Transform|Indent|Decoration|Align)|ags)|SQRT(?:1_2|2)|i(?:n(?:ner(?:Height|Width)|put)|ds|gnoreCase)|zIndex|o(?:scpu|n(?:readystatechange|Line)|uter(?:Height|Width)|p(?:sProfile|ener)|ffscreenBuffering)|NEGATIVE_INFINITY|d(?:i(?:splay|alog(?:Height|Top|Width|Left|Arguments)|rectories)|e(?:scription|fault(?:Status|Ch(?:ecked|arset)|View)))|u(?:ser(?:Profile|Language|Agent)|n(?:iqueID|defined)|pdateInterval)|_content|p(?:ixelDepth|ort|ersonalbar|kcs11|l(?:ugins|atform)|a(?:thname|dding(?:Right|Bottom|Top|Left)|rent(?:Window|Layer)?|ge(?:X(?:Offset)?|Y(?:Offset)?))|r(?:o(?:to(?:col|type)|duct(?:Sub)?|mpter)|e(?:vious|fix)))|e(?:n(?:coding|abledPlugin)|x(?:ternal|pando)|mbeds)|v(?:isibility|endor(?:Sub)?|Linkcolor)|URLUnencoded|P(?:I|OSITIVE_INFINITY)|f(?:ilename|o(?:nt(?:Size|Family|Weight)|rmName)|rame(?:s|Element)|gColor)|E|whiteSpace|l(?:i(?:stStyleType|n(?:eHeight|kColor))|o(?:ca(?:tion(?:bar)?|lName)|wsrc)|e(?:ngth|ft(?:Context)?)|a(?:st(?:M(?:odified|atch)|Index|Paren)|yer(?:s|X)|nguage))|a(?:pp(?:MinorVersion|Name|Co(?:deName|re)|Version)|vail(?:Height|Top|Width|Left)|ll|r(?:ity|guments)|Linkcolor|bove)|r(?:ight(?:Context)?|e(?:sponse(?:XML|Text)|adyState))|global|x|m(?:imeTypes|ultiline|enubar|argin(?:Right|Bottom|Top|Left))|L(?:N(?:10|2)|OG(?:10E|2E))|b(?:o(?:ttom|rder(?:Width|RightWidth|BottomWidth|Style|Color|TopWidth|LeftWidth))|ufferDepth|elow|ackground(?:Color|Image)))\b/
                        }, {
                            token: "identifier",
                            regex: identifierRe
                        }, {
                            regex: "",
                            token: "empty",
                            next: "no_regex"
                        }],
                        "start": [DocCommentHighlightRules.getStartRule("doc-start"), comments("start"), {
                            token: "string.regexp",
                            regex: "\\/",
                            next: "regex"
                        }, {
                            token: "text",
                            regex: "\\s+|^$",
                            next: "start"
                        }, {
                            token: "empty",
                            regex: "",
                            next: "no_regex"
                        }],
                        "regex": [{
                            token: "regexp.keyword.operator",
                            regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
                        }, {
                            token: "string.regexp",
                            regex: "/[sxngimy]*",
                            next: "no_regex"
                        }, {
                            token: "invalid",
                            regex: /\{\d+\b,?\d*\}[+*]|[+*$^?][+*]|[$^][?]|\?{3,}/
                        }, {
                            token: "constant.language.escape",
                            regex: /\(\?[:=!]|\)|\{\d+\b,?\d*\}|[+*]\?|[()$^+*?.]/
                        }, {
                            token: "constant.language.delimiter",
                            regex: /\|/
                        }, {
                            token: "constant.language.escape",
                            regex: /\[\^?/,
                            next: "regex_character_class"
                        }, {
                            token: "empty",
                            regex: "$",
                            next: "no_regex"
                        }, {
                            defaultToken: "string.regexp"
                        }],
                        "regex_character_class": [{
                            token: "regexp.charclass.keyword.operator",
                            regex: "\\\\(?:u[\\da-fA-F]{4}|x[\\da-fA-F]{2}|.)"
                        }, {
                            token: "constant.language.escape",
                            regex: "]",
                            next: "regex"
                        }, {
                            token: "constant.language.escape",
                            regex: "-"
                        }, {
                            token: "empty",
                            regex: "$",
                            next: "no_regex"
                        }, {
                            defaultToken: "string.regexp.charachterclass"
                        }],
                        "function_arguments": [{
                            token: "variable.parameter",
                            regex: identifierRe
                        }, {
                            token: "punctuation.operator",
                            regex: "[, ]+"
                        }, {
                            token: "punctuation.operator",
                            regex: "$"
                        }, {
                            token: "empty",
                            regex: "",
                            next: "no_regex"
                        }],
                        "qqstring": [{
                            token: "constant.language.escape",
                            regex: escapedRe
                        }, {
                            token: "string",
                            regex: "\\\\$",
                            next: "qqstring"
                        }, {
                            token: "string",
                            regex: '"|$',
                            next: "no_regex"
                        }, {
                            defaultToken: "string"
                        }],
                        "qstring": [{
                            token: "constant.language.escape",
                            regex: escapedRe
                        }, {
                            token: "string",
                            regex: "\\\\$",
                            next: "qstring"
                        }, {
                            token: "string",
                            regex: "'|$",
                            next: "no_regex"
                        }, {
                            defaultToken: "string"
                        }]
                    };

                    if (!options || !options.noES6) {
                        this.$rules.no_regex.unshift({
                            regex: "[{}]", onMatch: function onMatch(val, state, stack) {
                                this.next = val == "{" ? this.nextState : "";
                                if (val == "{" && stack.length) {
                                    stack.unshift("start", state);
                                } else if (val == "}" && stack.length) {
                                    stack.shift();
                                    this.next = stack.shift();
                                    if (this.next.indexOf("string") != -1 || this.next.indexOf("jsx") != -1) return "paren.quasi.end";
                                }
                                return val == "{" ? "paren.lparen" : "paren.rparen";
                            },
                            nextState: "start"
                        }, {
                            token: "string.quasi.start",
                            regex: /`/,
                            push: [{
                                token: "constant.language.escape",
                                regex: escapedRe
                            }, {
                                token: "paren.quasi.start",
                                regex: /\${/,
                                push: "start"
                            }, {
                                token: "string.quasi.end",
                                regex: /`/,
                                next: "pop"
                            }, {
                                defaultToken: "string.quasi"
                            }]
                        });

                        if (!options || !options.noJSX) JSX.call(this);
                    }

                    this.embedRules(DocCommentHighlightRules, "doc-", [DocCommentHighlightRules.getEndRule("no_regex")]);

                    this.normalizeRules();
                };

                oop.inherits(JavaScriptHighlightRules, TextHighlightRules);

                function JSX() {
                    var tagRegex = identifierRe.replace("\\d", "\\d\\-");
                    var jsxTag = {
                        onMatch: function onMatch(val, state, stack) {
                            var offset = val.charAt(1) == "/" ? 2 : 1;
                            if (offset == 1) {
                                if (state != this.nextState) stack.unshift(this.next, this.nextState, 0);else stack.unshift(this.next);
                                stack[2]++;
                            } else if (offset == 2) {
                                if (state == this.nextState) {
                                    stack[1]--;
                                    if (!stack[1] || stack[1] < 0) {
                                        stack.shift();
                                        stack.shift();
                                    }
                                }
                            }
                            return [{
                                type: "meta.tag.punctuation." + (offset == 1 ? "" : "end-") + "tag-open.xml",
                                value: val.slice(0, offset)
                            }, {
                                type: "meta.tag.tag-name.xml",
                                value: val.substr(offset)
                            }];
                        },
                        regex: "</?" + tagRegex + "",
                        next: "jsxAttributes",
                        nextState: "jsx"
                    };
                    this.$rules.start.unshift(jsxTag);
                    var jsxJsRule = {
                        regex: "{",
                        token: "paren.quasi.start",
                        push: "start"
                    };
                    this.$rules.jsx = [jsxJsRule, jsxTag, { include: "reference" }, { defaultToken: "string" }];
                    this.$rules.jsxAttributes = [{
                        token: "meta.tag.punctuation.tag-close.xml",
                        regex: "/?>",
                        onMatch: function onMatch(value, currentState, stack) {
                            if (currentState == stack[0]) stack.shift();
                            if (value.length == 2) {
                                if (stack[0] == this.nextState) stack[1]--;
                                if (!stack[1] || stack[1] < 0) {
                                    stack.splice(0, 2);
                                }
                            }
                            this.next = stack[0] || "start";
                            return [{ type: this.token, value: value }];
                        },
                        nextState: "jsx"
                    }, jsxJsRule, comments("jsxAttributes"), {
                        token: "entity.other.attribute-name.xml",
                        regex: tagRegex
                    }, {
                        token: "keyword.operator.attribute-equals.xml",
                        regex: "="
                    }, {
                        token: "text.tag-whitespace.xml",
                        regex: "\\s+"
                    }, {
                        token: "string.attribute-value.xml",
                        regex: "'",
                        stateName: "jsx_attr_q",
                        push: [{ token: "string.attribute-value.xml", regex: "'", next: "pop" }, { include: "reference" }, { defaultToken: "string.attribute-value.xml" }]
                    }, {
                        token: "string.attribute-value.xml",
                        regex: '"',
                        stateName: "jsx_attr_qq",
                        push: [{ token: "string.attribute-value.xml", regex: '"', next: "pop" }, { include: "reference" }, { defaultToken: "string.attribute-value.xml" }]
                    }, jsxTag];
                    this.$rules.reference = [{
                        token: "constant.language.escape.reference.xml",
                        regex: "(?:&#[0-9]+;)|(?:&#x[0-9a-fA-F]+;)|(?:&[a-zA-Z0-9_:\\.-]+;)"
                    }];
                }

                function comments(next) {
                    return [{
                        token: "comment",
                        regex: /\/\*/,
                        next: [DocCommentHighlightRules.getTagRule(), { token: "comment", regex: "\\*\\/", next: next || "pop" }, { defaultToken: "comment", caseInsensitive: true }]
                    }, {
                        token: "comment",
                        regex: "\\/\\/",
                        next: [DocCommentHighlightRules.getTagRule(), { token: "comment", regex: "$|^", next: next || "pop" }, { defaultToken: "comment", caseInsensitive: true }]
                    }];
                }
                exports.JavaScriptHighlightRules = JavaScriptHighlightRules;
            });

            ace.define("ace/mode/matching_brace_outdent", ["require", "exports", "module", "ace/range"], function (require, exports, module) {
                "use strict";

                var Range = require("../range").Range;

                var MatchingBraceOutdent = function MatchingBraceOutdent() {};

                (function () {

                    this.checkOutdent = function (line, input) {
                        if (!/^\s+$/.test(line)) return false;

                        return (/^\s*\}/.test(input)
                        );
                    };

                    this.autoOutdent = function (doc, row) {
                        var line = doc.getLine(row);
                        var match = line.match(/^(\s*\})/);

                        if (!match) return 0;

                        var column = match[1].length;
                        var openBracePos = doc.findMatchingBracket({ row: row, column: column });

                        if (!openBracePos || openBracePos.row == row) return 0;

                        var indent = this.$getIndent(doc.getLine(openBracePos.row));
                        doc.replace(new Range(row, 0, row, column - 1), indent);
                    };

                    this.$getIndent = function (line) {
                        return line.match(/^\s*/)[0];
                    };
                }).call(MatchingBraceOutdent.prototype);

                exports.MatchingBraceOutdent = MatchingBraceOutdent;
            });

            ace.define("ace/mode/behaviour/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator", "ace/lib/lang"], function (require, exports, module) {
                "use strict";

                var oop = require("../../lib/oop");
                var Behaviour = require("../behaviour").Behaviour;
                var TokenIterator = require("../../token_iterator").TokenIterator;
                var lang = require("../../lib/lang");

                var SAFE_INSERT_IN_TOKENS = ["text", "paren.rparen", "punctuation.operator"];
                var SAFE_INSERT_BEFORE_TOKENS = ["text", "paren.rparen", "punctuation.operator", "comment"];

                var context;
                var contextCache = {};
                var initContext = function initContext(editor) {
                    var id = -1;
                    if (editor.multiSelect) {
                        id = editor.selection.index;
                        if (contextCache.rangeCount != editor.multiSelect.rangeCount) contextCache = { rangeCount: editor.multiSelect.rangeCount };
                    }
                    if (contextCache[id]) return context = contextCache[id];
                    context = contextCache[id] = {
                        autoInsertedBrackets: 0,
                        autoInsertedRow: -1,
                        autoInsertedLineEnd: "",
                        maybeInsertedBrackets: 0,
                        maybeInsertedRow: -1,
                        maybeInsertedLineStart: "",
                        maybeInsertedLineEnd: ""
                    };
                };

                var getWrapped = function getWrapped(selection, selected, opening, closing) {
                    var rowDiff = selection.end.row - selection.start.row;
                    return {
                        text: opening + selected + closing,
                        selection: [0, selection.start.column + 1, rowDiff, selection.end.column + (rowDiff ? 0 : 1)]
                    };
                };

                var CstyleBehaviour = function CstyleBehaviour() {
                    this.add("braces", "insertion", function (state, action, editor, session, text) {
                        var cursor = editor.getCursorPosition();
                        var line = session.doc.getLine(cursor.row);
                        if (text == '{') {
                            initContext(editor);
                            var selection = editor.getSelectionRange();
                            var selected = session.doc.getTextRange(selection);
                            if (selected !== "" && selected !== "{" && editor.getWrapBehavioursEnabled()) {
                                return getWrapped(selection, selected, '{', '}');
                            } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                                if (/[\]\}\)]/.test(line[cursor.column]) || editor.inMultiSelectMode) {
                                    CstyleBehaviour.recordAutoInsert(editor, session, "}");
                                    return {
                                        text: '{}',
                                        selection: [1, 1]
                                    };
                                } else {
                                    CstyleBehaviour.recordMaybeInsert(editor, session, "{");
                                    return {
                                        text: '{',
                                        selection: [1, 1]
                                    };
                                }
                            }
                        } else if (text == '}') {
                            initContext(editor);
                            var rightChar = line.substring(cursor.column, cursor.column + 1);
                            if (rightChar == '}') {
                                var matching = session.$findOpeningBracket('}', { column: cursor.column + 1, row: cursor.row });
                                if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                                    CstyleBehaviour.popAutoInsertedClosing();
                                    return {
                                        text: '',
                                        selection: [1, 1]
                                    };
                                }
                            }
                        } else if (text == "\n" || text == "\r\n") {
                            initContext(editor);
                            var closing = "";
                            if (CstyleBehaviour.isMaybeInsertedClosing(cursor, line)) {
                                closing = lang.stringRepeat("}", context.maybeInsertedBrackets);
                                CstyleBehaviour.clearMaybeInsertedClosing();
                            }
                            var rightChar = line.substring(cursor.column, cursor.column + 1);
                            if (rightChar === '}') {
                                var openBracePos = session.findMatchingBracket({ row: cursor.row, column: cursor.column + 1 }, '}');
                                if (!openBracePos) return null;
                                var next_indent = this.$getIndent(session.getLine(openBracePos.row));
                            } else if (closing) {
                                var next_indent = this.$getIndent(line);
                            } else {
                                CstyleBehaviour.clearMaybeInsertedClosing();
                                return;
                            }
                            var indent = next_indent + session.getTabString();

                            return {
                                text: '\n' + indent + '\n' + next_indent + closing,
                                selection: [1, indent.length, 1, indent.length]
                            };
                        } else {
                            CstyleBehaviour.clearMaybeInsertedClosing();
                        }
                    });

                    this.add("braces", "deletion", function (state, action, editor, session, range) {
                        var selected = session.doc.getTextRange(range);
                        if (!range.isMultiLine() && selected == '{') {
                            initContext(editor);
                            var line = session.doc.getLine(range.start.row);
                            var rightChar = line.substring(range.end.column, range.end.column + 1);
                            if (rightChar == '}') {
                                range.end.column++;
                                return range;
                            } else {
                                context.maybeInsertedBrackets--;
                            }
                        }
                    });

                    this.add("parens", "insertion", function (state, action, editor, session, text) {
                        if (text == '(') {
                            initContext(editor);
                            var selection = editor.getSelectionRange();
                            var selected = session.doc.getTextRange(selection);
                            if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                                return getWrapped(selection, selected, '(', ')');
                            } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                                CstyleBehaviour.recordAutoInsert(editor, session, ")");
                                return {
                                    text: '()',
                                    selection: [1, 1]
                                };
                            }
                        } else if (text == ')') {
                            initContext(editor);
                            var cursor = editor.getCursorPosition();
                            var line = session.doc.getLine(cursor.row);
                            var rightChar = line.substring(cursor.column, cursor.column + 1);
                            if (rightChar == ')') {
                                var matching = session.$findOpeningBracket(')', { column: cursor.column + 1, row: cursor.row });
                                if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                                    CstyleBehaviour.popAutoInsertedClosing();
                                    return {
                                        text: '',
                                        selection: [1, 1]
                                    };
                                }
                            }
                        }
                    });

                    this.add("parens", "deletion", function (state, action, editor, session, range) {
                        var selected = session.doc.getTextRange(range);
                        if (!range.isMultiLine() && selected == '(') {
                            initContext(editor);
                            var line = session.doc.getLine(range.start.row);
                            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                            if (rightChar == ')') {
                                range.end.column++;
                                return range;
                            }
                        }
                    });

                    this.add("brackets", "insertion", function (state, action, editor, session, text) {
                        if (text == '[') {
                            initContext(editor);
                            var selection = editor.getSelectionRange();
                            var selected = session.doc.getTextRange(selection);
                            if (selected !== "" && editor.getWrapBehavioursEnabled()) {
                                return getWrapped(selection, selected, '[', ']');
                            } else if (CstyleBehaviour.isSaneInsertion(editor, session)) {
                                CstyleBehaviour.recordAutoInsert(editor, session, "]");
                                return {
                                    text: '[]',
                                    selection: [1, 1]
                                };
                            }
                        } else if (text == ']') {
                            initContext(editor);
                            var cursor = editor.getCursorPosition();
                            var line = session.doc.getLine(cursor.row);
                            var rightChar = line.substring(cursor.column, cursor.column + 1);
                            if (rightChar == ']') {
                                var matching = session.$findOpeningBracket(']', { column: cursor.column + 1, row: cursor.row });
                                if (matching !== null && CstyleBehaviour.isAutoInsertedClosing(cursor, line, text)) {
                                    CstyleBehaviour.popAutoInsertedClosing();
                                    return {
                                        text: '',
                                        selection: [1, 1]
                                    };
                                }
                            }
                        }
                    });

                    this.add("brackets", "deletion", function (state, action, editor, session, range) {
                        var selected = session.doc.getTextRange(range);
                        if (!range.isMultiLine() && selected == '[') {
                            initContext(editor);
                            var line = session.doc.getLine(range.start.row);
                            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                            if (rightChar == ']') {
                                range.end.column++;
                                return range;
                            }
                        }
                    });

                    this.add("string_dquotes", "insertion", function (state, action, editor, session, text) {
                        if (text == '"' || text == "'") {
                            initContext(editor);
                            var quote = text;
                            var selection = editor.getSelectionRange();
                            var selected = session.doc.getTextRange(selection);
                            if (selected !== "" && selected !== "'" && selected != '"' && editor.getWrapBehavioursEnabled()) {
                                return getWrapped(selection, selected, quote, quote);
                            } else if (!selected) {
                                var cursor = editor.getCursorPosition();
                                var line = session.doc.getLine(cursor.row);
                                var leftChar = line.substring(cursor.column - 1, cursor.column);
                                var rightChar = line.substring(cursor.column, cursor.column + 1);

                                var token = session.getTokenAt(cursor.row, cursor.column);
                                var rightToken = session.getTokenAt(cursor.row, cursor.column + 1);
                                if (leftChar == "\\" && token && /escape/.test(token.type)) return null;

                                var stringBefore = token && /string|escape/.test(token.type);
                                var stringAfter = !rightToken || /string|escape/.test(rightToken.type);

                                var pair;
                                if (rightChar == quote) {
                                    pair = stringBefore !== stringAfter;
                                } else {
                                    if (stringBefore && !stringAfter) return null;
                                    if (stringBefore && stringAfter) return null;
                                    var wordRe = session.$mode.tokenRe;
                                    wordRe.lastIndex = 0;
                                    var isWordBefore = wordRe.test(leftChar);
                                    wordRe.lastIndex = 0;
                                    var isWordAfter = wordRe.test(leftChar);
                                    if (isWordBefore || isWordAfter) return null;
                                    if (rightChar && !/[\s;,.})\]\\]/.test(rightChar)) return null;
                                    pair = true;
                                }
                                return {
                                    text: pair ? quote + quote : "",
                                    selection: [1, 1]
                                };
                            }
                        }
                    });

                    this.add("string_dquotes", "deletion", function (state, action, editor, session, range) {
                        var selected = session.doc.getTextRange(range);
                        if (!range.isMultiLine() && (selected == '"' || selected == "'")) {
                            initContext(editor);
                            var line = session.doc.getLine(range.start.row);
                            var rightChar = line.substring(range.start.column + 1, range.start.column + 2);
                            if (rightChar == selected) {
                                range.end.column++;
                                return range;
                            }
                        }
                    });
                };

                CstyleBehaviour.isSaneInsertion = function (editor, session) {
                    var cursor = editor.getCursorPosition();
                    var iterator = new TokenIterator(session, cursor.row, cursor.column);
                    if (!this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS)) {
                        var iterator2 = new TokenIterator(session, cursor.row, cursor.column + 1);
                        if (!this.$matchTokenType(iterator2.getCurrentToken() || "text", SAFE_INSERT_IN_TOKENS)) return false;
                    }
                    iterator.stepForward();
                    return iterator.getCurrentTokenRow() !== cursor.row || this.$matchTokenType(iterator.getCurrentToken() || "text", SAFE_INSERT_BEFORE_TOKENS);
                };

                CstyleBehaviour.$matchTokenType = function (token, types) {
                    return types.indexOf(token.type || token) > -1;
                };

                CstyleBehaviour.recordAutoInsert = function (editor, session, bracket) {
                    var cursor = editor.getCursorPosition();
                    var line = session.doc.getLine(cursor.row);
                    if (!this.isAutoInsertedClosing(cursor, line, context.autoInsertedLineEnd[0])) context.autoInsertedBrackets = 0;
                    context.autoInsertedRow = cursor.row;
                    context.autoInsertedLineEnd = bracket + line.substr(cursor.column);
                    context.autoInsertedBrackets++;
                };

                CstyleBehaviour.recordMaybeInsert = function (editor, session, bracket) {
                    var cursor = editor.getCursorPosition();
                    var line = session.doc.getLine(cursor.row);
                    if (!this.isMaybeInsertedClosing(cursor, line)) context.maybeInsertedBrackets = 0;
                    context.maybeInsertedRow = cursor.row;
                    context.maybeInsertedLineStart = line.substr(0, cursor.column) + bracket;
                    context.maybeInsertedLineEnd = line.substr(cursor.column);
                    context.maybeInsertedBrackets++;
                };

                CstyleBehaviour.isAutoInsertedClosing = function (cursor, line, bracket) {
                    return context.autoInsertedBrackets > 0 && cursor.row === context.autoInsertedRow && bracket === context.autoInsertedLineEnd[0] && line.substr(cursor.column) === context.autoInsertedLineEnd;
                };

                CstyleBehaviour.isMaybeInsertedClosing = function (cursor, line) {
                    return context.maybeInsertedBrackets > 0 && cursor.row === context.maybeInsertedRow && line.substr(cursor.column) === context.maybeInsertedLineEnd && line.substr(0, cursor.column) == context.maybeInsertedLineStart;
                };

                CstyleBehaviour.popAutoInsertedClosing = function () {
                    context.autoInsertedLineEnd = context.autoInsertedLineEnd.substr(1);
                    context.autoInsertedBrackets--;
                };

                CstyleBehaviour.clearMaybeInsertedClosing = function () {
                    if (context) {
                        context.maybeInsertedBrackets = 0;
                        context.maybeInsertedRow = -1;
                    }
                };

                oop.inherits(CstyleBehaviour, Behaviour);

                exports.CstyleBehaviour = CstyleBehaviour;
            });

            ace.define("ace/mode/folding/cstyle", ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/folding/fold_mode"], function (require, exports, module) {
                "use strict";

                var oop = require("../../lib/oop");
                var Range = require("../../range").Range;
                var BaseFoldMode = require("./fold_mode").FoldMode;

                var FoldMode = exports.FoldMode = function (commentRegex) {
                    if (commentRegex) {
                        this.foldingStartMarker = new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.start));
                        this.foldingStopMarker = new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + commentRegex.end));
                    }
                };
                oop.inherits(FoldMode, BaseFoldMode);

                (function () {

                    this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/;
                    this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/;
                    this.singleLineBlockCommentRe = /^\s*(\/\*).*\*\/\s*$/;
                    this.tripleStarBlockCommentRe = /^\s*(\/\*\*\*).*\*\/\s*$/;
                    this.startRegionRe = /^\s*(\/\*|\/\/)#?region\b/;
                    this._getFoldWidgetBase = this.getFoldWidget;
                    this.getFoldWidget = function (session, foldStyle, row) {
                        var line = session.getLine(row);

                        if (this.singleLineBlockCommentRe.test(line)) {
                            if (!this.startRegionRe.test(line) && !this.tripleStarBlockCommentRe.test(line)) return "";
                        }

                        var fw = this._getFoldWidgetBase(session, foldStyle, row);

                        if (!fw && this.startRegionRe.test(line)) return "start";

                        return fw;
                    };

                    this.getFoldWidgetRange = function (session, foldStyle, row, forceMultiline) {
                        var line = session.getLine(row);

                        if (this.startRegionRe.test(line)) return this.getCommentRegionBlock(session, line, row);

                        var match = line.match(this.foldingStartMarker);
                        if (match) {
                            var i = match.index;

                            if (match[1]) return this.openingBracketBlock(session, match[1], row, i);

                            var range = session.getCommentFoldRange(row, i + match[0].length, 1);

                            if (range && !range.isMultiLine()) {
                                if (forceMultiline) {
                                    range = this.getSectionRange(session, row);
                                } else if (foldStyle != "all") range = null;
                            }

                            return range;
                        }

                        if (foldStyle === "markbegin") return;

                        var match = line.match(this.foldingStopMarker);
                        if (match) {
                            var i = match.index + match[0].length;

                            if (match[1]) return this.closingBracketBlock(session, match[1], row, i);

                            return session.getCommentFoldRange(row, i, -1);
                        }
                    };

                    this.getSectionRange = function (session, row) {
                        var line = session.getLine(row);
                        var startIndent = line.search(/\S/);
                        var startRow = row;
                        var startColumn = line.length;
                        row = row + 1;
                        var endRow = row;
                        var maxRow = session.getLength();
                        while (++row < maxRow) {
                            line = session.getLine(row);
                            var indent = line.search(/\S/);
                            if (indent === -1) continue;
                            if (startIndent > indent) break;
                            var subRange = this.getFoldWidgetRange(session, "all", row);

                            if (subRange) {
                                if (subRange.start.row <= startRow) {
                                    break;
                                } else if (subRange.isMultiLine()) {
                                    row = subRange.end.row;
                                } else if (startIndent == indent) {
                                    break;
                                }
                            }
                            endRow = row;
                        }

                        return new Range(startRow, startColumn, endRow, session.getLine(endRow).length);
                    };
                    this.getCommentRegionBlock = function (session, line, row) {
                        var startColumn = line.search(/\s*$/);
                        var maxRow = session.getLength();
                        var startRow = row;

                        var re = /^\s*(?:\/\*|\/\/|--)#?(end)?region\b/;
                        var depth = 1;
                        while (++row < maxRow) {
                            line = session.getLine(row);
                            var m = re.exec(line);
                            if (!m) continue;
                            if (m[1]) depth--;else depth++;

                            if (!depth) break;
                        }

                        var endRow = row;
                        if (endRow > startRow) {
                            return new Range(startRow, startColumn, endRow, line.length);
                        }
                    };
                }).call(FoldMode.prototype);
            });

            ace.define("ace/mode/javascript", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/javascript_highlight_rules", "ace/mode/matching_brace_outdent", "ace/range", "ace/worker/worker_client", "ace/mode/behaviour/cstyle", "ace/mode/folding/cstyle"], function (require, exports, module) {
                "use strict";

                var oop = require("../lib/oop");
                var TextMode = require("./text").Mode;
                var JavaScriptHighlightRules = require("./javascript_highlight_rules").JavaScriptHighlightRules;
                var MatchingBraceOutdent = require("./matching_brace_outdent").MatchingBraceOutdent;
                var Range = require("../range").Range;
                var WorkerClient = require("../worker/worker_client").WorkerClient;
                var CstyleBehaviour = require("./behaviour/cstyle").CstyleBehaviour;
                var CStyleFoldMode = require("./folding/cstyle").FoldMode;

                var Mode = function Mode() {
                    this.HighlightRules = JavaScriptHighlightRules;

                    this.$outdent = new MatchingBraceOutdent();
                    this.$behaviour = new CstyleBehaviour();
                    this.foldingRules = new CStyleFoldMode();
                };
                oop.inherits(Mode, TextMode);

                (function () {

                    this.lineCommentStart = "//";
                    this.blockComment = { start: "/*", end: "*/" };

                    this.getNextLineIndent = function (state, line, tab) {
                        var indent = this.$getIndent(line);

                        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
                        var tokens = tokenizedLine.tokens;
                        var endState = tokenizedLine.state;

                        if (tokens.length && tokens[tokens.length - 1].type == "comment") {
                            return indent;
                        }

                        if (state == "start" || state == "no_regex") {
                            var match = line.match(/^.*(?:\bcase\b.*\:|[\{\(\[])\s*$/);
                            if (match) {
                                indent += tab;
                            }
                        } else if (state == "doc-start") {
                            if (endState == "start" || endState == "no_regex") {
                                return "";
                            }
                            var match = line.match(/^\s*(\/?)\*/);
                            if (match) {
                                if (match[1]) {
                                    indent += " ";
                                }
                                indent += "* ";
                            }
                        }

                        return indent;
                    };

                    this.checkOutdent = function (state, line, input) {
                        return this.$outdent.checkOutdent(line, input);
                    };

                    this.autoOutdent = function (state, doc, row) {
                        this.$outdent.autoOutdent(doc, row);
                    };

                    this.createWorker = function (session) {
                        var worker = new WorkerClient(["ace"], "ace/mode/javascript_worker", "JavaScriptWorker");
                        worker.attachToDocument(session.getDocument());

                        worker.on("annotate", function (results) {
                            session.setAnnotations(results.data);
                        });

                        worker.on("terminate", function () {
                            session.clearAnnotations();
                        });

                        return worker;
                    };

                    this.$id = "ace/mode/javascript";
                }).call(Mode.prototype);

                exports.Mode = Mode;
            });
        }
    };
});
//# sourceMappingURL=data:application/json;base64,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QXFCLENBQUM7aUJBQ3BDLENBQUEsQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUV4Qix1QkFBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7YUFDbkIsQ0FBQyxDQUFDIiwiZmlsZSI6Im1vZGUtamF2YXNjcmlwdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qICovIFxuXCJmb3JtYXQgZ2xvYmFsXCI7XG5hY2UuZGVmaW5lKFwiYWNlL21vZGUvZG9jX2NvbW1lbnRfaGlnaGxpZ2h0X3J1bGVzXCIsW1wicmVxdWlyZVwiLFwiZXhwb3J0c1wiLFwibW9kdWxlXCIsXCJhY2UvbGliL29vcFwiLFwiYWNlL21vZGUvdGV4dF9oaWdobGlnaHRfcnVsZXNcIl0sIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiLi4vbGliL29vcFwiKTtcbnZhciBUZXh0SGlnaGxpZ2h0UnVsZXMgPSByZXF1aXJlKFwiLi90ZXh0X2hpZ2hsaWdodF9ydWxlc1wiKS5UZXh0SGlnaGxpZ2h0UnVsZXM7XG5cbnZhciBEb2NDb21tZW50SGlnaGxpZ2h0UnVsZXMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLiRydWxlcyA9IHtcbiAgICAgICAgXCJzdGFydFwiIDogWyB7XG4gICAgICAgICAgICB0b2tlbiA6IFwiY29tbWVudC5kb2MudGFnXCIsXG4gICAgICAgICAgICByZWdleCA6IFwiQFtcXFxcd1xcXFxkX10rXCIgLy8gVE9ETzogZml4IGVtYWlsIGFkZHJlc3Nlc1xuICAgICAgICB9LCBcbiAgICAgICAgRG9jQ29tbWVudEhpZ2hsaWdodFJ1bGVzLmdldFRhZ1J1bGUoKSxcbiAgICAgICAge1xuICAgICAgICAgICAgZGVmYXVsdFRva2VuIDogXCJjb21tZW50LmRvY1wiLFxuICAgICAgICAgICAgY2FzZUluc2Vuc2l0aXZlOiB0cnVlXG4gICAgICAgIH1dXG4gICAgfTtcbn07XG5cbm9vcC5pbmhlcml0cyhEb2NDb21tZW50SGlnaGxpZ2h0UnVsZXMsIFRleHRIaWdobGlnaHRSdWxlcyk7XG5cbkRvY0NvbW1lbnRIaWdobGlnaHRSdWxlcy5nZXRUYWdSdWxlID0gZnVuY3Rpb24oc3RhcnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0b2tlbiA6IFwiY29tbWVudC5kb2MudGFnLnN0b3JhZ2UudHlwZVwiLFxuICAgICAgICByZWdleCA6IFwiXFxcXGIoPzpUT0RPfEZJWE1FfFhYWHxIQUNLKVxcXFxiXCJcbiAgICB9O1xufVxuXG5Eb2NDb21tZW50SGlnaGxpZ2h0UnVsZXMuZ2V0U3RhcnRSdWxlID0gZnVuY3Rpb24oc3RhcnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0b2tlbiA6IFwiY29tbWVudC5kb2NcIiwgLy8gZG9jIGNvbW1lbnRcbiAgICAgICAgcmVnZXggOiBcIlxcXFwvXFxcXCooPz1cXFxcKilcIixcbiAgICAgICAgbmV4dCAgOiBzdGFydFxuICAgIH07XG59O1xuXG5Eb2NDb21tZW50SGlnaGxpZ2h0UnVsZXMuZ2V0RW5kUnVsZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHRva2VuIDogXCJjb21tZW50LmRvY1wiLCAvLyBjbG9zaW5nIGNvbW1lbnRcbiAgICAgICAgcmVnZXggOiBcIlxcXFwqXFxcXC9cIixcbiAgICAgICAgbmV4dCAgOiBzdGFydFxuICAgIH07XG59O1xuXG5cbmV4cG9ydHMuRG9jQ29tbWVudEhpZ2hsaWdodFJ1bGVzID0gRG9jQ29tbWVudEhpZ2hsaWdodFJ1bGVzO1xuXG59KTtcblxuYWNlLmRlZmluZShcImFjZS9tb2RlL2phdmFzY3JpcHRfaGlnaGxpZ2h0X3J1bGVzXCIsW1wicmVxdWlyZVwiLFwiZXhwb3J0c1wiLFwibW9kdWxlXCIsXCJhY2UvbGliL29vcFwiLFwiYWNlL21vZGUvZG9jX2NvbW1lbnRfaGlnaGxpZ2h0X3J1bGVzXCIsXCJhY2UvbW9kZS90ZXh0X2hpZ2hsaWdodF9ydWxlc1wiXSwgZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIG9vcCA9IHJlcXVpcmUoXCIuLi9saWIvb29wXCIpO1xudmFyIERvY0NvbW1lbnRIaWdobGlnaHRSdWxlcyA9IHJlcXVpcmUoXCIuL2RvY19jb21tZW50X2hpZ2hsaWdodF9ydWxlc1wiKS5Eb2NDb21tZW50SGlnaGxpZ2h0UnVsZXM7XG52YXIgVGV4dEhpZ2hsaWdodFJ1bGVzID0gcmVxdWlyZShcIi4vdGV4dF9oaWdobGlnaHRfcnVsZXNcIikuVGV4dEhpZ2hsaWdodFJ1bGVzO1xudmFyIGlkZW50aWZpZXJSZSA9IFwiW2EtekEtWlxcXFwkX1xcdTAwYTEtXFx1ZmZmZl1bYS16QS1aXFxcXGRcXFxcJF9cXHUwMGExLVxcdWZmZmZdKlxcXFxiXCI7XG5cbnZhciBKYXZhU2NyaXB0SGlnaGxpZ2h0UnVsZXMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGtleXdvcmRNYXBwZXIgPSB0aGlzLmNyZWF0ZUtleXdvcmRNYXBwZXIoe1xuICAgICAgICBcInZhcmlhYmxlLmxhbmd1YWdlXCI6XG4gICAgICAgICAgICBcIkFycmF5fEJvb2xlYW58RGF0ZXxGdW5jdGlvbnxJdGVyYXRvcnxOdW1iZXJ8T2JqZWN0fFJlZ0V4cHxTdHJpbmd8UHJveHl8XCIgICsgLy8gQ29uc3RydWN0b3JzXG4gICAgICAgICAgICBcIk5hbWVzcGFjZXxRTmFtZXxYTUx8WE1MTGlzdHxcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgLy8gRTRYXG4gICAgICAgICAgICBcIkFycmF5QnVmZmVyfEZsb2F0MzJBcnJheXxGbG9hdDY0QXJyYXl8SW50MTZBcnJheXxJbnQzMkFycmF5fEludDhBcnJheXxcIiAgICtcbiAgICAgICAgICAgIFwiVWludDE2QXJyYXl8VWludDMyQXJyYXl8VWludDhBcnJheXxVaW50OENsYW1wZWRBcnJheXxcIiAgICAgICAgICAgICAgICAgICAgK1xuICAgICAgICAgICAgXCJFcnJvcnxFdmFsRXJyb3J8SW50ZXJuYWxFcnJvcnxSYW5nZUVycm9yfFJlZmVyZW5jZUVycm9yfFN0b3BJdGVyYXRpb258XCIgICArIC8vIEVycm9yc1xuICAgICAgICAgICAgXCJTeW50YXhFcnJvcnxUeXBlRXJyb3J8VVJJRXJyb3J8XCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArXG4gICAgICAgICAgICBcImRlY29kZVVSSXxkZWNvZGVVUklDb21wb25lbnR8ZW5jb2RlVVJJfGVuY29kZVVSSUNvbXBvbmVudHxldmFsfGlzRmluaXRlfFwiICsgLy8gTm9uLWNvbnN0cnVjdG9yIGZ1bmN0aW9uc1xuICAgICAgICAgICAgXCJpc05hTnxwYXJzZUZsb2F0fHBhcnNlSW50fFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArXG4gICAgICAgICAgICBcIkpTT058TWF0aHxcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgLy8gT3RoZXJcbiAgICAgICAgICAgIFwidGhpc3xhcmd1bWVudHN8cHJvdG90eXBlfHdpbmRvd3xkb2N1bWVudFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCAvLyBQc2V1ZG9cbiAgICAgICAgXCJrZXl3b3JkXCI6XG4gICAgICAgICAgICBcImNvbnN0fHlpZWxkfGltcG9ydHxnZXR8c2V0fFwiICtcbiAgICAgICAgICAgIFwiYnJlYWt8Y2FzZXxjYXRjaHxjb250aW51ZXxkZWZhdWx0fGRlbGV0ZXxkb3xlbHNlfGZpbmFsbHl8Zm9yfGZ1bmN0aW9ufFwiICtcbiAgICAgICAgICAgIFwiaWZ8aW58aW5zdGFuY2VvZnxuZXd8cmV0dXJufHN3aXRjaHx0aHJvd3x0cnl8dHlwZW9mfGxldHx2YXJ8d2hpbGV8d2l0aHxkZWJ1Z2dlcnxcIiArXG4gICAgICAgICAgICBcIl9fcGFyZW50X198X19jb3VudF9ffGVzY2FwZXx1bmVzY2FwZXx3aXRofF9fcHJvdG9fX3xcIiArXG4gICAgICAgICAgICBcImNsYXNzfGVudW18ZXh0ZW5kc3xzdXBlcnxleHBvcnR8aW1wbGVtZW50c3xwcml2YXRlfHB1YmxpY3xpbnRlcmZhY2V8cGFja2FnZXxwcm90ZWN0ZWR8c3RhdGljXCIsXG4gICAgICAgIFwic3RvcmFnZS50eXBlXCI6XG4gICAgICAgICAgICBcImNvbnN0fGxldHx2YXJ8ZnVuY3Rpb25cIixcbiAgICAgICAgXCJjb25zdGFudC5sYW5ndWFnZVwiOlxuICAgICAgICAgICAgXCJudWxsfEluZmluaXR5fE5hTnx1bmRlZmluZWRcIixcbiAgICAgICAgXCJzdXBwb3J0LmZ1bmN0aW9uXCI6XG4gICAgICAgICAgICBcImFsZXJ0XCIsXG4gICAgICAgIFwiY29uc3RhbnQubGFuZ3VhZ2UuYm9vbGVhblwiOiBcInRydWV8ZmFsc2VcIlxuICAgIH0sIFwiaWRlbnRpZmllclwiKTtcbiAgICB2YXIga3dCZWZvcmVSZSA9IFwiY2FzZXxkb3xlbHNlfGZpbmFsbHl8aW58aW5zdGFuY2VvZnxyZXR1cm58dGhyb3d8dHJ5fHR5cGVvZnx5aWVsZHx2b2lkXCI7XG5cbiAgICB2YXIgZXNjYXBlZFJlID0gXCJcXFxcXFxcXCg/OnhbMC05YS1mQS1GXXsyfXxcIiArIC8vIGhleFxuICAgICAgICBcInVbMC05YS1mQS1GXXs0fXxcIiArIC8vIHVuaWNvZGVcbiAgICAgICAgXCJ1e1swLTlhLWZBLUZdezEsNn19fFwiICsgLy8gZXM2IHVuaWNvZGVcbiAgICAgICAgXCJbMC0yXVswLTddezAsMn18XCIgKyAvLyBvY3RcbiAgICAgICAgXCIzWzAtN11bMC03XT98XCIgKyAvLyBvY3RcbiAgICAgICAgXCJbNC03XVswLTddP3xcIiArIC8vb2N0XG4gICAgICAgIFwiLilcIjtcblxuICAgIHRoaXMuJHJ1bGVzID0ge1xuICAgICAgICBcIm5vX3JlZ2V4XCIgOiBbXG4gICAgICAgICAgICBEb2NDb21tZW50SGlnaGxpZ2h0UnVsZXMuZ2V0U3RhcnRSdWxlKFwiZG9jLXN0YXJ0XCIpLFxuICAgICAgICAgICAgY29tbWVudHMoXCJub19yZWdleFwiKSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiBcIicoPz0uKVwiLFxuICAgICAgICAgICAgICAgIG5leHQgIDogXCJxc3RyaW5nXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiAnXCIoPz0uKScsXG4gICAgICAgICAgICAgICAgbmV4dCAgOiBcInFxc3RyaW5nXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwiY29uc3RhbnQubnVtZXJpY1wiLCAvLyBoZXhcbiAgICAgICAgICAgICAgICByZWdleCA6IC8wKD86W3hYXVswLTlhLWZBLUZdK3xbYkJdWzAxXSspXFxiL1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJjb25zdGFudC5udW1lcmljXCIsIC8vIGZsb2F0XG4gICAgICAgICAgICAgICAgcmVnZXggOiAvWystXT9cXGRbXFxkX10qKD86KD86XFwuXFxkKik/KD86W2VFXVsrLV0/XFxkKyk/KT9cXGIvXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBbXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmFnZS50eXBlXCIsIFwicHVuY3R1YXRpb24ub3BlcmF0b3JcIiwgXCJzdXBwb3J0LmZ1bmN0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIFwicHVuY3R1YXRpb24ub3BlcmF0b3JcIiwgXCJlbnRpdHkubmFtZS5mdW5jdGlvblwiLCBcInRleHRcIixcImtleXdvcmQub3BlcmF0b3JcIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVnZXggOiBcIihcIiArIGlkZW50aWZpZXJSZSArIFwiKShcXFxcLikocHJvdG90eXBlKShcXFxcLikoXCIgKyBpZGVudGlmaWVyUmUgK1wiKShcXFxccyopKD0pXCIsXG4gICAgICAgICAgICAgICAgbmV4dDogXCJmdW5jdGlvbl9hcmd1bWVudHNcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogW1xuICAgICAgICAgICAgICAgICAgICBcInN0b3JhZ2UudHlwZVwiLCBcInB1bmN0dWF0aW9uLm9wZXJhdG9yXCIsIFwiZW50aXR5Lm5hbWUuZnVuY3Rpb25cIiwgXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwia2V5d29yZC5vcGVyYXRvclwiLCBcInRleHRcIiwgXCJzdG9yYWdlLnR5cGVcIiwgXCJ0ZXh0XCIsIFwicGFyZW4ubHBhcmVuXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogXCIoXCIgKyBpZGVudGlmaWVyUmUgKyBcIikoXFxcXC4pKFwiICsgaWRlbnRpZmllclJlICtcIikoXFxcXHMqKSg9KShcXFxccyopKGZ1bmN0aW9uKShcXFxccyopKFxcXFwoKVwiLFxuICAgICAgICAgICAgICAgIG5leHQ6IFwiZnVuY3Rpb25fYXJndW1lbnRzXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJlbnRpdHkubmFtZS5mdW5jdGlvblwiLCBcInRleHRcIiwgXCJrZXl3b3JkLm9wZXJhdG9yXCIsIFwidGV4dFwiLCBcInN0b3JhZ2UudHlwZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInRleHRcIiwgXCJwYXJlbi5scGFyZW5cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVnZXggOiBcIihcIiArIGlkZW50aWZpZXJSZSArXCIpKFxcXFxzKikoPSkoXFxcXHMqKShmdW5jdGlvbikoXFxcXHMqKShcXFxcKClcIixcbiAgICAgICAgICAgICAgICBuZXh0OiBcImZ1bmN0aW9uX2FyZ3VtZW50c1wiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBbXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmFnZS50eXBlXCIsIFwicHVuY3R1YXRpb24ub3BlcmF0b3JcIiwgXCJlbnRpdHkubmFtZS5mdW5jdGlvblwiLCBcInRleHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJrZXl3b3JkLm9wZXJhdG9yXCIsIFwidGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICBcInN0b3JhZ2UudHlwZVwiLCBcInRleHRcIiwgXCJlbnRpdHkubmFtZS5mdW5jdGlvblwiLCBcInRleHRcIiwgXCJwYXJlbi5scGFyZW5cIlxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgcmVnZXggOiBcIihcIiArIGlkZW50aWZpZXJSZSArIFwiKShcXFxcLikoXCIgKyBpZGVudGlmaWVyUmUgK1wiKShcXFxccyopKD0pKFxcXFxzKikoZnVuY3Rpb24pKFxcXFxzKykoXFxcXHcrKShcXFxccyopKFxcXFwoKVwiLFxuICAgICAgICAgICAgICAgIG5leHQ6IFwiZnVuY3Rpb25fYXJndW1lbnRzXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yYWdlLnR5cGVcIiwgXCJ0ZXh0XCIsIFwiZW50aXR5Lm5hbWUuZnVuY3Rpb25cIiwgXCJ0ZXh0XCIsIFwicGFyZW4ubHBhcmVuXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogXCIoZnVuY3Rpb24pKFxcXFxzKykoXCIgKyBpZGVudGlmaWVyUmUgKyBcIikoXFxcXHMqKShcXFxcKClcIixcbiAgICAgICAgICAgICAgICBuZXh0OiBcImZ1bmN0aW9uX2FyZ3VtZW50c1wiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiZW50aXR5Lm5hbWUuZnVuY3Rpb25cIiwgXCJ0ZXh0XCIsIFwicHVuY3R1YXRpb24ub3BlcmF0b3JcIixcbiAgICAgICAgICAgICAgICAgICAgXCJ0ZXh0XCIsIFwic3RvcmFnZS50eXBlXCIsIFwidGV4dFwiLCBcInBhcmVuLmxwYXJlblwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZWdleCA6IFwiKFwiICsgaWRlbnRpZmllclJlICsgXCIpKFxcXFxzKikoOikoXFxcXHMqKShmdW5jdGlvbikoXFxcXHMqKShcXFxcKClcIixcbiAgICAgICAgICAgICAgICBuZXh0OiBcImZ1bmN0aW9uX2FyZ3VtZW50c1wiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBbXG4gICAgICAgICAgICAgICAgICAgIFwidGV4dFwiLCBcInRleHRcIiwgXCJzdG9yYWdlLnR5cGVcIiwgXCJ0ZXh0XCIsIFwicGFyZW4ubHBhcmVuXCJcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogXCIoOikoXFxcXHMqKShmdW5jdGlvbikoXFxcXHMqKShcXFxcKClcIixcbiAgICAgICAgICAgICAgICBuZXh0OiBcImZ1bmN0aW9uX2FyZ3VtZW50c1wiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcImtleXdvcmRcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IFwiKD86XCIgKyBrd0JlZm9yZVJlICsgXCIpXFxcXGJcIixcbiAgICAgICAgICAgICAgICBuZXh0IDogXCJzdGFydFwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBbXCJzdXBwb3J0LmNvbnN0YW50XCJdLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogL3RoYXRcXGIvXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBbXCJzdG9yYWdlLnR5cGVcIiwgXCJwdW5jdHVhdGlvbi5vcGVyYXRvclwiLCBcInN1cHBvcnQuZnVuY3Rpb24uZmlyZWJ1Z1wiXSxcbiAgICAgICAgICAgICAgICByZWdleCA6IC8oY29uc29sZSkoXFwuKSh3YXJufGluZm98bG9nfGVycm9yfHRpbWV8dHJhY2V8dGltZUVuZHxhc3NlcnQpXFxiL1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDoga2V5d29yZE1hcHBlcixcbiAgICAgICAgICAgICAgICByZWdleCA6IGlkZW50aWZpZXJSZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJwdW5jdHVhdGlvbi5vcGVyYXRvclwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogL1suXSg/IVsuXSkvLFxuICAgICAgICAgICAgICAgIG5leHQgIDogXCJwcm9wZXJ0eVwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcImtleXdvcmQub3BlcmF0b3JcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IC8tLXxcXCtcXCt8XFwuezN9fD09PXw9PXw9fCE9fCE9PXw8Kz0/fD4rPT98IXwmJnxcXHxcXHx8XFw/XFw6fFshJCUmKitcXC1+XFwvXl09Py8sXG4gICAgICAgICAgICAgICAgbmV4dCAgOiBcInN0YXJ0XCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwicHVuY3R1YXRpb24ub3BlcmF0b3JcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IC9bPzosOy5dLyxcbiAgICAgICAgICAgICAgICBuZXh0ICA6IFwic3RhcnRcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJwYXJlbi5scGFyZW5cIixcbiAgICAgICAgICAgICAgICByZWdleCA6IC9bXFxbKHtdLyxcbiAgICAgICAgICAgICAgICBuZXh0ICA6IFwic3RhcnRcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJwYXJlbi5ycGFyZW5cIixcbiAgICAgICAgICAgICAgICByZWdleCA6IC9bXFxdKX1dL1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuOiBcImNvbW1lbnRcIixcbiAgICAgICAgICAgICAgICByZWdleDogL14jIS4qJC9cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgcHJvcGVydHk6IFt7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcInRleHRcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IFwiXFxcXHMrXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJzdG9yYWdlLnR5cGVcIiwgXCJwdW5jdHVhdGlvbi5vcGVyYXRvclwiLCBcImVudGl0eS5uYW1lLmZ1bmN0aW9uXCIsIFwidGV4dFwiLFxuICAgICAgICAgICAgICAgICAgICBcImtleXdvcmQub3BlcmF0b3JcIiwgXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwic3RvcmFnZS50eXBlXCIsIFwidGV4dFwiLCBcImVudGl0eS5uYW1lLmZ1bmN0aW9uXCIsIFwidGV4dFwiLCBcInBhcmVuLmxwYXJlblwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICByZWdleCA6IFwiKFwiICsgaWRlbnRpZmllclJlICsgXCIpKFxcXFwuKShcIiArIGlkZW50aWZpZXJSZSArXCIpKFxcXFxzKikoPSkoXFxcXHMqKShmdW5jdGlvbikoPzooXFxcXHMrKShcXFxcdyspKT8oXFxcXHMqKShcXFxcKClcIixcbiAgICAgICAgICAgICAgICBuZXh0OiBcImZ1bmN0aW9uX2FyZ3VtZW50c1wiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcInB1bmN0dWF0aW9uLm9wZXJhdG9yXCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiAvWy5dKD8hWy5dKS9cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwic3VwcG9ydC5mdW5jdGlvblwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogLyhzKD86aCg/OmlmdHxvdyg/Ok1vZCg/OmVsZXNzRGlhbG9nfGFsRGlhbG9nKXxIZWxwKSl8Y3JvbGwoPzpYfEJ5KD86UGFnZXN8TGluZXMpP3xZfFRvKT98dCg/Om9wfHJpa2UpfGkoPzpufHplVG9Db250ZW50fGRlYmFyfGduVGV4dCl8b3J0fHUoPzpwfGIoPzpzdHIoPzppbmcpPyk/KXxwbGkoPzpjZXx0KXxlKD86bmR8dCg/OlJlKD86c2l6YWJsZXxxdWVzdEhlYWRlcil8TSg/OmkoPzpudXRlc3xsbGlzZWNvbmRzKXxvbnRoKXxTZWNvbmRzfEhvKD86dEtleXN8dXJzKXxZZWFyfEN1cnNvcnxUaW1lKD86b3V0KT98SW50ZXJ2YWx8Wk9wdGlvbnN8RGF0ZXxVVEMoPzpNKD86aSg/Om51dGVzfGxsaXNlY29uZHMpfG9udGgpfFNlY29uZHN8SG91cnN8RGF0ZXxGdWxsWWVhcil8RnVsbFllYXJ8QWN0aXZlKXxhcmNoKXxxcnR8bGljZXxhdmVQcmVmZXJlbmNlc3xtYWxsKXxoKD86b21lfGFuZGxlRXZlbnQpfG5hdmlnYXRlfGMoPzpoYXIoPzpDb2RlQXR8QXQpfG8oPzpzfG4oPzpjYXR8dGV4dHVhbHxmaXJtKXxtcGlsZSl8ZWlsfGxlYXIoPzpUaW1lb3V0fEludGVydmFsKT98YSg/OnB0dXJlRXZlbnRzfGxsKXxyZWF0ZSg/OlN0eWxlU2hlZXR8UG9wdXB8RXZlbnRPYmplY3QpKXx0KD86byg/OkdNVFN0cmluZ3xTKD86dHJpbmd8b3VyY2UpfFUoPzpUQ1N0cmluZ3xwcGVyQ2FzZSl8TG8oPzpjYWxlU3RyaW5nfHdlckNhc2UpKXxlc3R8YSg/Om58aW50KD86RW5hYmxlZCk/KSl8aSg/OnMoPzpOYU58RmluaXRlKXxuZGV4T2Z8dGFsaWNzKXxkKD86aXNhYmxlRXh0ZXJuYWxDYXB0dXJlfHVtcHxldGFjaEV2ZW50KXx1KD86big/OnNoaWZ0fHRhaW50fGVzY2FwZXx3YXRjaCl8cGRhdGVDb21tYW5kcyl8aig/Om9pbnxhdmFFbmFibGVkKXxwKD86byg/OnB8dyl8dXNofGx1Z2lucy5yZWZyZXNofGEoPzpkZGluZ3N8cnNlKD86SW50fEZsb2F0KT8pfHIoPzppbnR8b21wdHxlZmVyZW5jZSkpfGUoPzpzY2FwZXxuYWJsZUV4dGVybmFsQ2FwdHVyZXx2YWx8bGVtZW50RnJvbVBvaW50fHgoPzpwfGVjKD86U2NyaXB0fENvbW1hbmQpPykpfHZhbHVlT2Z8VVRDfHF1ZXJ5Q29tbWFuZCg/OlN0YXRlfEluZGV0ZXJtfEVuYWJsZWR8VmFsdWUpfGYoPzppKD86bmR8bGUoPzpNb2RpZmllZERhdGV8U2l6ZXxDcmVhdGVkRGF0ZXxVcGRhdGVkRGF0ZSl8eGVkKXxvKD86bnQoPzpzaXplfGNvbG9yKXxyd2FyZCl8bG9vcnxyb21DaGFyQ29kZSl8d2F0Y2h8bCg/Omlua3xvKD86YWR8Zyl8YXN0SW5kZXhPZil8YSg/OnNpbnxuY2hvcnxjb3N8dCg/OnRhY2hFdmVudHxvYnxhbig/OjIpPyl8cHBseXxsZXJ0fGIoPzpzfG9ydCkpfHIoPzpvdSg/Om5kfHRlRXZlbnRzKXxlKD86c2l6ZSg/OkJ5fFRvKXxjYWxjfHR1cm5WYWx1ZXxwbGFjZXx2ZXJzZXxsKD86b2FkfGVhc2UoPzpDYXB0dXJlfEV2ZW50cykpKXxhbmRvbSl8Zyg/Om98ZXQoPzpSZXNwb25zZUhlYWRlcnxNKD86aSg/Om51dGVzfGxsaXNlY29uZHMpfG9udGgpfFNlKD86Y29uZHN8bGVjdGlvbil8SG91cnN8WWVhcnxUaW1lKD86em9uZU9mZnNldCk/fERhKD86eXx0ZSl8VVRDKD86TSg/OmkoPzpudXRlc3xsbGlzZWNvbmRzKXxvbnRoKXxTZWNvbmRzfEhvdXJzfERhKD86eXx0ZSl8RnVsbFllYXIpfEZ1bGxZZWFyfEEoPzp0dGVudGlvbnxsbFJlc3BvbnNlSGVhZGVycykpKXxtKD86aW58b3ZlKD86Qig/Onl8ZWxvdyl8VG8oPzpBYnNvbHV0ZSk/fEFib3ZlKXxlcmdlQXR0cmlidXRlc3xhKD86dGNofHJnaW5zfHgpKXxiKD86dG9hfGlnfG8oPzpsZHxyZGVyV2lkdGhzKXxsaW5rfGFjaykpXFxiKD89XFwoKS9cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwic3VwcG9ydC5mdW5jdGlvbi5kb21cIixcbiAgICAgICAgICAgICAgICByZWdleCA6IC8ocyg/OnViKD86c3RyaW5nRGF0YXxtaXQpfHBsaXRUZXh0fGUoPzp0KD86TmFtZWRJdGVtfEF0dHJpYnV0ZSg/Ok5vZGUpPyl8bGVjdCkpfGhhcyg/OkNoaWxkTm9kZXN8RmVhdHVyZSl8bmFtZWRJdGVtfGMoPzpsKD86aWNrfG8oPzpzZXxuZU5vZGUpKXxyZWF0ZSg/OkMoPzpvbW1lbnR8REFUQVNlY3Rpb258YXB0aW9uKXxUKD86SGVhZHxleHROb2RlfEZvb3QpfERvY3VtZW50RnJhZ21lbnR8UHJvY2Vzc2luZ0luc3RydWN0aW9ufEUoPzpudGl0eVJlZmVyZW5jZXxsZW1lbnQpfEF0dHJpYnV0ZSkpfHRhYkluZGV4fGkoPzpuc2VydCg/OlJvd3xCZWZvcmV8Q2VsbHxEYXRhKXx0ZW0pfG9wZW58ZGVsZXRlKD86Um93fEMoPzplbGx8YXB0aW9uKXxUKD86SGVhZHxGb290KXxEYXRhKXxmb2N1c3x3cml0ZSg/OmxuKT98YSg/OmRkfHBwZW5kKD86Q2hpbGR8RGF0YSkpfHJlKD86c2V0fHBsYWNlKD86Q2hpbGR8RGF0YSl8bW92ZSg/Ok5hbWVkSXRlbXxDaGlsZHxBdHRyaWJ1dGUoPzpOb2RlKT8pPyl8Z2V0KD86TmFtZWRJdGVtfEVsZW1lbnQoPzpzQnkoPzpOYW1lfFRhZ05hbWV8Q2xhc3NOYW1lKXxCeUlkKXxBdHRyaWJ1dGUoPzpOb2RlKT8pfGJsdXIpXFxiKD89XFwoKS9cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6ICBcInN1cHBvcnQuY29uc3RhbnRcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IC8ocyg/OnlzdGVtTGFuZ3VhZ2V8Y3IoPzppcHRzfG9sbGJhcnN8ZWVuKD86WHxZfFRvcHxMZWZ0KSl8dCg/OnlsZSg/OlNoZWV0cyk/fGF0dXMoPzpUZXh0fGJhcik/KXxpYmxpbmcoPzpCZWxvd3xBYm92ZSl8b3VyY2V8dWZmaXhlc3xlKD86Y3VyaXR5KD86UG9saWN5KT98bCg/OmVjdGlvbnxmKSkpfGgoPzppc3Rvcnl8b3N0KD86bmFtZSk/fGFzKD86aHxGb2N1cykpfHl8WCg/Ok1MRG9jdW1lbnR8U0xEb2N1bWVudCl8big/OmV4dHxhbWUoPzpzcGFjZSg/OnN8VVJJKXxQcm9wKSl8TSg/OklOX1ZBTFVFfEFYX1ZBTFVFKXxjKD86aGFyYWN0ZXJTZXR8byg/Om4oPzpzdHJ1Y3Rvcnx0cm9sbGVycyl8b2tpZUVuYWJsZWR8bG9yRGVwdGh8bXAoPzpvbmVudHN8bGV0ZSkpfHVycmVudHxwdUNsYXNzfGwoPzppKD86cCg/OmJvYXJkRGF0YSk/fGVudEluZm9ybWF0aW9uKXxvc2VkfGFzc2VzKXxhbGxlKD86ZXxyKXxyeXB0byl8dCg/Om8oPzpvbGJhcnxwKXxleHQoPzpUcmFuc2Zvcm18SW5kZW50fERlY29yYXRpb258QWxpZ24pfGFncyl8U1FSVCg/OjFfMnwyKXxpKD86big/Om5lcig/OkhlaWdodHxXaWR0aCl8cHV0KXxkc3xnbm9yZUNhc2UpfHpJbmRleHxvKD86c2NwdXxuKD86cmVhZHlzdGF0ZWNoYW5nZXxMaW5lKXx1dGVyKD86SGVpZ2h0fFdpZHRoKXxwKD86c1Byb2ZpbGV8ZW5lcil8ZmZzY3JlZW5CdWZmZXJpbmcpfE5FR0FUSVZFX0lORklOSVRZfGQoPzppKD86c3BsYXl8YWxvZyg/OkhlaWdodHxUb3B8V2lkdGh8TGVmdHxBcmd1bWVudHMpfHJlY3Rvcmllcyl8ZSg/OnNjcmlwdGlvbnxmYXVsdCg/OlN0YXR1c3xDaCg/OmVja2VkfGFyc2V0KXxWaWV3KSkpfHUoPzpzZXIoPzpQcm9maWxlfExhbmd1YWdlfEFnZW50KXxuKD86aXF1ZUlEfGRlZmluZWQpfHBkYXRlSW50ZXJ2YWwpfF9jb250ZW50fHAoPzppeGVsRGVwdGh8b3J0fGVyc29uYWxiYXJ8a2NzMTF8bCg/OnVnaW5zfGF0Zm9ybSl8YSg/OnRobmFtZXxkZGluZyg/OlJpZ2h0fEJvdHRvbXxUb3B8TGVmdCl8cmVudCg/OldpbmRvd3xMYXllcik/fGdlKD86WCg/Ok9mZnNldCk/fFkoPzpPZmZzZXQpPykpfHIoPzpvKD86dG8oPzpjb2x8dHlwZSl8ZHVjdCg/OlN1Yik/fG1wdGVyKXxlKD86dmlvdXN8Zml4KSkpfGUoPzpuKD86Y29kaW5nfGFibGVkUGx1Z2luKXx4KD86dGVybmFsfHBhbmRvKXxtYmVkcyl8dig/OmlzaWJpbGl0eXxlbmRvcig/OlN1Yik/fExpbmtjb2xvcil8VVJMVW5lbmNvZGVkfFAoPzpJfE9TSVRJVkVfSU5GSU5JVFkpfGYoPzppbGVuYW1lfG8oPzpudCg/OlNpemV8RmFtaWx5fFdlaWdodCl8cm1OYW1lKXxyYW1lKD86c3xFbGVtZW50KXxnQ29sb3IpfEV8d2hpdGVTcGFjZXxsKD86aSg/OnN0U3R5bGVUeXBlfG4oPzplSGVpZ2h0fGtDb2xvcikpfG8oPzpjYSg/OnRpb24oPzpiYXIpP3xsTmFtZSl8d3NyYyl8ZSg/Om5ndGh8ZnQoPzpDb250ZXh0KT8pfGEoPzpzdCg/Ok0oPzpvZGlmaWVkfGF0Y2gpfEluZGV4fFBhcmVuKXx5ZXIoPzpzfFgpfG5ndWFnZSkpfGEoPzpwcCg/Ok1pbm9yVmVyc2lvbnxOYW1lfENvKD86ZGVOYW1lfHJlKXxWZXJzaW9uKXx2YWlsKD86SGVpZ2h0fFRvcHxXaWR0aHxMZWZ0KXxsbHxyKD86aXR5fGd1bWVudHMpfExpbmtjb2xvcnxib3ZlKXxyKD86aWdodCg/OkNvbnRleHQpP3xlKD86c3BvbnNlKD86WE1MfFRleHQpfGFkeVN0YXRlKSl8Z2xvYmFsfHh8bSg/OmltZVR5cGVzfHVsdGlsaW5lfGVudWJhcnxhcmdpbig/OlJpZ2h0fEJvdHRvbXxUb3B8TGVmdCkpfEwoPzpOKD86MTB8Mil8T0coPzoxMEV8MkUpKXxiKD86byg/OnR0b218cmRlcig/OldpZHRofFJpZ2h0V2lkdGh8Qm90dG9tV2lkdGh8U3R5bGV8Q29sb3J8VG9wV2lkdGh8TGVmdFdpZHRoKSl8dWZmZXJEZXB0aHxlbG93fGFja2dyb3VuZCg/OkNvbG9yfEltYWdlKSkpXFxiL1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJpZGVudGlmaWVyXCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiBpZGVudGlmaWVyUmVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICByZWdleDogXCJcIixcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJlbXB0eVwiLFxuICAgICAgICAgICAgICAgIG5leHQ6IFwibm9fcmVnZXhcIlxuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBcInN0YXJ0XCI6IFtcbiAgICAgICAgICAgIERvY0NvbW1lbnRIaWdobGlnaHRSdWxlcy5nZXRTdGFydFJ1bGUoXCJkb2Mtc3RhcnRcIiksXG4gICAgICAgICAgICBjb21tZW50cyhcInN0YXJ0XCIpLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRva2VuOiBcInN0cmluZy5yZWdleHBcIixcbiAgICAgICAgICAgICAgICByZWdleDogXCJcXFxcL1wiLFxuICAgICAgICAgICAgICAgIG5leHQ6IFwicmVnZXhcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJ0ZXh0XCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiBcIlxcXFxzK3xeJFwiLFxuICAgICAgICAgICAgICAgIG5leHQgOiBcInN0YXJ0XCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJlbXB0eVwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4OiBcIlwiLFxuICAgICAgICAgICAgICAgIG5leHQ6IFwibm9fcmVnZXhcIlxuICAgICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBcInJlZ2V4XCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJyZWdleHAua2V5d29yZC5vcGVyYXRvclwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4OiBcIlxcXFxcXFxcKD86dVtcXFxcZGEtZkEtRl17NH18eFtcXFxcZGEtZkEtRl17Mn18LilcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuOiBcInN0cmluZy5yZWdleHBcIixcbiAgICAgICAgICAgICAgICByZWdleDogXCIvW3N4bmdpbXldKlwiLFxuICAgICAgICAgICAgICAgIG5leHQ6IFwibm9fcmVnZXhcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJpbnZhbGlkXCIsXG4gICAgICAgICAgICAgICAgcmVnZXg6IC9cXHtcXGQrXFxiLD9cXGQqXFx9WysqXXxbKyokXj9dWysqXXxbJF5dWz9dfFxcP3szLH0vXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcImNvbnN0YW50Lmxhbmd1YWdlLmVzY2FwZVwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4OiAvXFwoXFw/Wzo9IV18XFwpfFxce1xcZCtcXGIsP1xcZCpcXH18WysqXVxcP3xbKCkkXisqPy5dL1xuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJjb25zdGFudC5sYW5ndWFnZS5kZWxpbWl0ZXJcIixcbiAgICAgICAgICAgICAgICByZWdleDogL1xcfC9cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJjb25zdGFudC5sYW5ndWFnZS5lc2NhcGVcIixcbiAgICAgICAgICAgICAgICByZWdleDogL1xcW1xcXj8vLFxuICAgICAgICAgICAgICAgIG5leHQ6IFwicmVnZXhfY2hhcmFjdGVyX2NsYXNzXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJlbXB0eVwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4OiBcIiRcIixcbiAgICAgICAgICAgICAgICBuZXh0OiBcIm5vX3JlZ2V4XCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0VG9rZW46IFwic3RyaW5nLnJlZ2V4cFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIFwicmVnZXhfY2hhcmFjdGVyX2NsYXNzXCI6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJyZWdleHAuY2hhcmNsYXNzLmtleXdvcmQub3BlcmF0b3JcIixcbiAgICAgICAgICAgICAgICByZWdleDogXCJcXFxcXFxcXCg/OnVbXFxcXGRhLWZBLUZdezR9fHhbXFxcXGRhLWZBLUZdezJ9fC4pXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJjb25zdGFudC5sYW5ndWFnZS5lc2NhcGVcIixcbiAgICAgICAgICAgICAgICByZWdleDogXCJdXCIsXG4gICAgICAgICAgICAgICAgbmV4dDogXCJyZWdleFwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW46IFwiY29uc3RhbnQubGFuZ3VhZ2UuZXNjYXBlXCIsXG4gICAgICAgICAgICAgICAgcmVnZXg6IFwiLVwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW46IFwiZW1wdHlcIixcbiAgICAgICAgICAgICAgICByZWdleDogXCIkXCIsXG4gICAgICAgICAgICAgICAgbmV4dDogXCJub19yZWdleFwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdFRva2VuOiBcInN0cmluZy5yZWdleHAuY2hhcmFjaHRlcmNsYXNzXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgXCJmdW5jdGlvbl9hcmd1bWVudHNcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRva2VuOiBcInZhcmlhYmxlLnBhcmFtZXRlclwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4OiBpZGVudGlmaWVyUmVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJwdW5jdHVhdGlvbi5vcGVyYXRvclwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4OiBcIlssIF0rXCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJwdW5jdHVhdGlvbi5vcGVyYXRvclwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4OiBcIiRcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuOiBcImVtcHR5XCIsXG4gICAgICAgICAgICAgICAgcmVnZXg6IFwiXCIsXG4gICAgICAgICAgICAgICAgbmV4dDogXCJub19yZWdleFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIFwicXFzdHJpbmdcIiA6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwiY29uc3RhbnQubGFuZ3VhZ2UuZXNjYXBlXCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiBlc2NhcGVkUmVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiBcIlxcXFxcXFxcJFwiLFxuICAgICAgICAgICAgICAgIG5leHQgIDogXCJxcXN0cmluZ1wiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogJ1wifCQnLFxuICAgICAgICAgICAgICAgIG5leHQgIDogXCJub19yZWdleFwiXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgZGVmYXVsdFRva2VuOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIFwicXN0cmluZ1wiIDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJjb25zdGFudC5sYW5ndWFnZS5lc2NhcGVcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IGVzY2FwZWRSZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IFwiXFxcXFxcXFwkXCIsXG4gICAgICAgICAgICAgICAgbmV4dCAgOiBcInFzdHJpbmdcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRva2VuIDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICByZWdleCA6IFwiJ3wkXCIsXG4gICAgICAgICAgICAgICAgbmV4dCAgOiBcIm5vX3JlZ2V4XCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBkZWZhdWx0VG9rZW46IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH07XG4gICAgXG4gICAgXG4gICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLm5vRVM2KSB7XG4gICAgICAgIHRoaXMuJHJ1bGVzLm5vX3JlZ2V4LnVuc2hpZnQoe1xuICAgICAgICAgICAgcmVnZXg6IFwiW3t9XVwiLCBvbk1hdGNoOiBmdW5jdGlvbih2YWwsIHN0YXRlLCBzdGFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IHZhbCA9PSBcIntcIiA/IHRoaXMubmV4dFN0YXRlIDogXCJcIjtcbiAgICAgICAgICAgICAgICBpZiAodmFsID09IFwie1wiICYmIHN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFjay51bnNoaWZ0KFwic3RhcnRcIiwgc3RhdGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWwgPT0gXCJ9XCIgJiYgc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHQuaW5kZXhPZihcInN0cmluZ1wiKSAhPSAtMSB8fCB0aGlzLm5leHQuaW5kZXhPZihcImpzeFwiKSAhPSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInBhcmVuLnF1YXNpLmVuZFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsID09IFwie1wiID8gXCJwYXJlbi5scGFyZW5cIiA6IFwicGFyZW4ucnBhcmVuXCI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dFN0YXRlOiBcInN0YXJ0XCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgdG9rZW4gOiBcInN0cmluZy5xdWFzaS5zdGFydFwiLFxuICAgICAgICAgICAgcmVnZXggOiAvYC8sXG4gICAgICAgICAgICBwdXNoICA6IFt7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcImNvbnN0YW50Lmxhbmd1YWdlLmVzY2FwZVwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogZXNjYXBlZFJlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdG9rZW4gOiBcInBhcmVuLnF1YXNpLnN0YXJ0XCIsXG4gICAgICAgICAgICAgICAgcmVnZXggOiAvXFwkey8sXG4gICAgICAgICAgICAgICAgcHVzaCAgOiBcInN0YXJ0XCJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA6IFwic3RyaW5nLnF1YXNpLmVuZFwiLFxuICAgICAgICAgICAgICAgIHJlZ2V4IDogL2AvLFxuICAgICAgICAgICAgICAgIG5leHQgIDogXCJwb3BcIlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIGRlZmF1bHRUb2tlbjogXCJzdHJpbmcucXVhc2lcIlxuICAgICAgICAgICAgfV1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgIW9wdGlvbnMubm9KU1gpXG4gICAgICAgICAgICBKU1guY2FsbCh0aGlzKTtcbiAgICB9XG4gICAgXG4gICAgdGhpcy5lbWJlZFJ1bGVzKERvY0NvbW1lbnRIaWdobGlnaHRSdWxlcywgXCJkb2MtXCIsXG4gICAgICAgIFsgRG9jQ29tbWVudEhpZ2hsaWdodFJ1bGVzLmdldEVuZFJ1bGUoXCJub19yZWdleFwiKSBdKTtcbiAgICBcbiAgICB0aGlzLm5vcm1hbGl6ZVJ1bGVzKCk7XG59O1xuXG5vb3AuaW5oZXJpdHMoSmF2YVNjcmlwdEhpZ2hsaWdodFJ1bGVzLCBUZXh0SGlnaGxpZ2h0UnVsZXMpO1xuXG5mdW5jdGlvbiBKU1goKSB7XG4gICAgdmFyIHRhZ1JlZ2V4ID0gaWRlbnRpZmllclJlLnJlcGxhY2UoXCJcXFxcZFwiLCBcIlxcXFxkXFxcXC1cIik7XG4gICAgdmFyIGpzeFRhZyA9IHtcbiAgICAgICAgb25NYXRjaCA6IGZ1bmN0aW9uKHZhbCwgc3RhdGUsIHN0YWNrKSB7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdmFsLmNoYXJBdCgxKSA9PSBcIi9cIiA/IDIgOiAxO1xuICAgICAgICAgICAgaWYgKG9mZnNldCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlICE9IHRoaXMubmV4dFN0YXRlKVxuICAgICAgICAgICAgICAgICAgICBzdGFjay51bnNoaWZ0KHRoaXMubmV4dCwgdGhpcy5uZXh0U3RhdGUsIDApO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sudW5zaGlmdCh0aGlzLm5leHQpO1xuICAgICAgICAgICAgICAgIHN0YWNrWzJdKys7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9mZnNldCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09IHRoaXMubmV4dFN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrWzFdLS07XG4gICAgICAgICAgICAgICAgICAgIGlmICghc3RhY2tbMV0gfHwgc3RhY2tbMV0gPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwibWV0YS50YWcucHVuY3R1YXRpb24uXCIgKyAob2Zmc2V0ID09IDEgPyBcIlwiIDogXCJlbmQtXCIpICsgXCJ0YWctb3Blbi54bWxcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogdmFsLnNsaWNlKDAsIG9mZnNldClcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm1ldGEudGFnLnRhZy1uYW1lLnhtbFwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB2YWwuc3Vic3RyKG9mZnNldClcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9LFxuICAgICAgICByZWdleCA6IFwiPC8/XCIgKyB0YWdSZWdleCArIFwiXCIsXG4gICAgICAgIG5leHQ6IFwianN4QXR0cmlidXRlc1wiLFxuICAgICAgICBuZXh0U3RhdGU6IFwianN4XCJcbiAgICB9O1xuICAgIHRoaXMuJHJ1bGVzLnN0YXJ0LnVuc2hpZnQoanN4VGFnKTtcbiAgICB2YXIganN4SnNSdWxlID0ge1xuICAgICAgICByZWdleDogXCJ7XCIsXG4gICAgICAgIHRva2VuOiBcInBhcmVuLnF1YXNpLnN0YXJ0XCIsXG4gICAgICAgIHB1c2g6IFwic3RhcnRcIlxuICAgIH07XG4gICAgdGhpcy4kcnVsZXMuanN4ID0gW1xuICAgICAgICBqc3hKc1J1bGUsXG4gICAgICAgIGpzeFRhZyxcbiAgICAgICAge2luY2x1ZGUgOiBcInJlZmVyZW5jZVwifSxcbiAgICAgICAge2RlZmF1bHRUb2tlbjogXCJzdHJpbmdcIn1cbiAgICBdO1xuICAgIHRoaXMuJHJ1bGVzLmpzeEF0dHJpYnV0ZXMgPSBbe1xuICAgICAgICB0b2tlbiA6IFwibWV0YS50YWcucHVuY3R1YXRpb24udGFnLWNsb3NlLnhtbFwiLCBcbiAgICAgICAgcmVnZXggOiBcIi8/PlwiLCBcbiAgICAgICAgb25NYXRjaCA6IGZ1bmN0aW9uKHZhbHVlLCBjdXJyZW50U3RhdGUsIHN0YWNrKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFN0YXRlID09IHN0YWNrWzBdKVxuICAgICAgICAgICAgICAgIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhY2tbMF0gPT0gdGhpcy5uZXh0U3RhdGUpXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrWzFdLS07XG4gICAgICAgICAgICAgICAgaWYgKCFzdGFja1sxXSB8fCBzdGFja1sxXSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhY2suc3BsaWNlKDAsIDIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubmV4dCA9IHN0YWNrWzBdIHx8IFwic3RhcnRcIjtcbiAgICAgICAgICAgIHJldHVybiBbe3R5cGU6IHRoaXMudG9rZW4sIHZhbHVlOiB2YWx1ZX1dO1xuICAgICAgICB9LFxuICAgICAgICBuZXh0U3RhdGU6IFwianN4XCJcbiAgICB9LCBcbiAgICBqc3hKc1J1bGUsXG4gICAgY29tbWVudHMoXCJqc3hBdHRyaWJ1dGVzXCIpLFxuICAgIHtcbiAgICAgICAgdG9rZW4gOiBcImVudGl0eS5vdGhlci5hdHRyaWJ1dGUtbmFtZS54bWxcIixcbiAgICAgICAgcmVnZXggOiB0YWdSZWdleFxuICAgIH0sIHtcbiAgICAgICAgdG9rZW4gOiBcImtleXdvcmQub3BlcmF0b3IuYXR0cmlidXRlLWVxdWFscy54bWxcIixcbiAgICAgICAgcmVnZXggOiBcIj1cIlxuICAgIH0sIHtcbiAgICAgICAgdG9rZW4gOiBcInRleHQudGFnLXdoaXRlc3BhY2UueG1sXCIsXG4gICAgICAgIHJlZ2V4IDogXCJcXFxccytcIlxuICAgIH0sIHtcbiAgICAgICAgdG9rZW4gOiBcInN0cmluZy5hdHRyaWJ1dGUtdmFsdWUueG1sXCIsXG4gICAgICAgIHJlZ2V4IDogXCInXCIsXG4gICAgICAgIHN0YXRlTmFtZSA6IFwianN4X2F0dHJfcVwiLFxuICAgICAgICBwdXNoIDogW1xuICAgICAgICAgICAge3Rva2VuIDogXCJzdHJpbmcuYXR0cmlidXRlLXZhbHVlLnhtbFwiLCByZWdleDogXCInXCIsIG5leHQ6IFwicG9wXCJ9LFxuICAgICAgICAgICAge2luY2x1ZGUgOiBcInJlZmVyZW5jZVwifSxcbiAgICAgICAgICAgIHtkZWZhdWx0VG9rZW4gOiBcInN0cmluZy5hdHRyaWJ1dGUtdmFsdWUueG1sXCJ9XG4gICAgICAgIF1cbiAgICB9LCB7XG4gICAgICAgIHRva2VuIDogXCJzdHJpbmcuYXR0cmlidXRlLXZhbHVlLnhtbFwiLFxuICAgICAgICByZWdleCA6ICdcIicsXG4gICAgICAgIHN0YXRlTmFtZSA6IFwianN4X2F0dHJfcXFcIixcbiAgICAgICAgcHVzaCA6IFtcbiAgICAgICAgICAgIHt0b2tlbiA6IFwic3RyaW5nLmF0dHJpYnV0ZS12YWx1ZS54bWxcIiwgcmVnZXg6ICdcIicsIG5leHQ6IFwicG9wXCJ9LFxuICAgICAgICAgICAge2luY2x1ZGUgOiBcInJlZmVyZW5jZVwifSxcbiAgICAgICAgICAgIHtkZWZhdWx0VG9rZW4gOiBcInN0cmluZy5hdHRyaWJ1dGUtdmFsdWUueG1sXCJ9XG4gICAgICAgIF1cbiAgICB9LFxuICAgIGpzeFRhZ1xuICAgIF07XG4gICAgdGhpcy4kcnVsZXMucmVmZXJlbmNlID0gW3tcbiAgICAgICAgdG9rZW4gOiBcImNvbnN0YW50Lmxhbmd1YWdlLmVzY2FwZS5yZWZlcmVuY2UueG1sXCIsXG4gICAgICAgIHJlZ2V4IDogXCIoPzomI1swLTldKzspfCg/OiYjeFswLTlhLWZBLUZdKzspfCg/OiZbYS16QS1aMC05XzpcXFxcLi1dKzspXCJcbiAgICB9XTtcbn1cblxuZnVuY3Rpb24gY29tbWVudHMobmV4dCkge1xuICAgIHJldHVybiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRva2VuIDogXCJjb21tZW50XCIsIC8vIG11bHRpIGxpbmUgY29tbWVudFxuICAgICAgICAgICAgcmVnZXggOiAvXFwvXFwqLyxcbiAgICAgICAgICAgIG5leHQ6IFtcbiAgICAgICAgICAgICAgICBEb2NDb21tZW50SGlnaGxpZ2h0UnVsZXMuZ2V0VGFnUnVsZSgpLFxuICAgICAgICAgICAgICAgIHt0b2tlbiA6IFwiY29tbWVudFwiLCByZWdleCA6IFwiXFxcXCpcXFxcL1wiLCBuZXh0IDogbmV4dCB8fCBcInBvcFwifSxcbiAgICAgICAgICAgICAgICB7ZGVmYXVsdFRva2VuIDogXCJjb21tZW50XCIsIGNhc2VJbnNlbnNpdGl2ZTogdHJ1ZX1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfSwge1xuICAgICAgICAgICAgdG9rZW4gOiBcImNvbW1lbnRcIixcbiAgICAgICAgICAgIHJlZ2V4IDogXCJcXFxcL1xcXFwvXCIsXG4gICAgICAgICAgICBuZXh0OiBbXG4gICAgICAgICAgICAgICAgRG9jQ29tbWVudEhpZ2hsaWdodFJ1bGVzLmdldFRhZ1J1bGUoKSxcbiAgICAgICAgICAgICAgICB7dG9rZW4gOiBcImNvbW1lbnRcIiwgcmVnZXggOiBcIiR8XlwiLCBuZXh0IDogbmV4dCB8fCBcInBvcFwifSxcbiAgICAgICAgICAgICAgICB7ZGVmYXVsdFRva2VuIDogXCJjb21tZW50XCIsIGNhc2VJbnNlbnNpdGl2ZTogdHJ1ZX1cbiAgICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgIF07XG59XG5leHBvcnRzLkphdmFTY3JpcHRIaWdobGlnaHRSdWxlcyA9IEphdmFTY3JpcHRIaWdobGlnaHRSdWxlcztcbn0pO1xuXG5hY2UuZGVmaW5lKFwiYWNlL21vZGUvbWF0Y2hpbmdfYnJhY2Vfb3V0ZGVudFwiLFtcInJlcXVpcmVcIixcImV4cG9ydHNcIixcIm1vZHVsZVwiLFwiYWNlL3JhbmdlXCJdLCBmdW5jdGlvbihyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgUmFuZ2UgPSByZXF1aXJlKFwiLi4vcmFuZ2VcIikuUmFuZ2U7XG5cbnZhciBNYXRjaGluZ0JyYWNlT3V0ZGVudCA9IGZ1bmN0aW9uKCkge307XG5cbihmdW5jdGlvbigpIHtcblxuICAgIHRoaXMuY2hlY2tPdXRkZW50ID0gZnVuY3Rpb24obGluZSwgaW5wdXQpIHtcbiAgICAgICAgaWYgKCEgL15cXHMrJC8udGVzdChsaW5lKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICByZXR1cm4gL15cXHMqXFx9Ly50ZXN0KGlucHV0KTtcbiAgICB9O1xuXG4gICAgdGhpcy5hdXRvT3V0ZGVudCA9IGZ1bmN0aW9uKGRvYywgcm93KSB7XG4gICAgICAgIHZhciBsaW5lID0gZG9jLmdldExpbmUocm93KTtcbiAgICAgICAgdmFyIG1hdGNoID0gbGluZS5tYXRjaCgvXihcXHMqXFx9KS8pO1xuXG4gICAgICAgIGlmICghbWF0Y2gpIHJldHVybiAwO1xuXG4gICAgICAgIHZhciBjb2x1bW4gPSBtYXRjaFsxXS5sZW5ndGg7XG4gICAgICAgIHZhciBvcGVuQnJhY2VQb3MgPSBkb2MuZmluZE1hdGNoaW5nQnJhY2tldCh7cm93OiByb3csIGNvbHVtbjogY29sdW1ufSk7XG5cbiAgICAgICAgaWYgKCFvcGVuQnJhY2VQb3MgfHwgb3BlbkJyYWNlUG9zLnJvdyA9PSByb3cpIHJldHVybiAwO1xuXG4gICAgICAgIHZhciBpbmRlbnQgPSB0aGlzLiRnZXRJbmRlbnQoZG9jLmdldExpbmUob3BlbkJyYWNlUG9zLnJvdykpO1xuICAgICAgICBkb2MucmVwbGFjZShuZXcgUmFuZ2Uocm93LCAwLCByb3csIGNvbHVtbi0xKSwgaW5kZW50KTtcbiAgICB9O1xuXG4gICAgdGhpcy4kZ2V0SW5kZW50ID0gZnVuY3Rpb24obGluZSkge1xuICAgICAgICByZXR1cm4gbGluZS5tYXRjaCgvXlxccyovKVswXTtcbiAgICB9O1xuXG59KS5jYWxsKE1hdGNoaW5nQnJhY2VPdXRkZW50LnByb3RvdHlwZSk7XG5cbmV4cG9ydHMuTWF0Y2hpbmdCcmFjZU91dGRlbnQgPSBNYXRjaGluZ0JyYWNlT3V0ZGVudDtcbn0pO1xuXG5hY2UuZGVmaW5lKFwiYWNlL21vZGUvYmVoYXZpb3VyL2NzdHlsZVwiLFtcInJlcXVpcmVcIixcImV4cG9ydHNcIixcIm1vZHVsZVwiLFwiYWNlL2xpYi9vb3BcIixcImFjZS9tb2RlL2JlaGF2aW91clwiLFwiYWNlL3Rva2VuX2l0ZXJhdG9yXCIsXCJhY2UvbGliL2xhbmdcIl0sIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiLi4vLi4vbGliL29vcFwiKTtcbnZhciBCZWhhdmlvdXIgPSByZXF1aXJlKFwiLi4vYmVoYXZpb3VyXCIpLkJlaGF2aW91cjtcbnZhciBUb2tlbkl0ZXJhdG9yID0gcmVxdWlyZShcIi4uLy4uL3Rva2VuX2l0ZXJhdG9yXCIpLlRva2VuSXRlcmF0b3I7XG52YXIgbGFuZyA9IHJlcXVpcmUoXCIuLi8uLi9saWIvbGFuZ1wiKTtcblxudmFyIFNBRkVfSU5TRVJUX0lOX1RPS0VOUyA9XG4gICAgW1widGV4dFwiLCBcInBhcmVuLnJwYXJlblwiLCBcInB1bmN0dWF0aW9uLm9wZXJhdG9yXCJdO1xudmFyIFNBRkVfSU5TRVJUX0JFRk9SRV9UT0tFTlMgPVxuICAgIFtcInRleHRcIiwgXCJwYXJlbi5ycGFyZW5cIiwgXCJwdW5jdHVhdGlvbi5vcGVyYXRvclwiLCBcImNvbW1lbnRcIl07XG5cbnZhciBjb250ZXh0O1xudmFyIGNvbnRleHRDYWNoZSA9IHt9O1xudmFyIGluaXRDb250ZXh0ID0gZnVuY3Rpb24oZWRpdG9yKSB7XG4gICAgdmFyIGlkID0gLTE7XG4gICAgaWYgKGVkaXRvci5tdWx0aVNlbGVjdCkge1xuICAgICAgICBpZCA9IGVkaXRvci5zZWxlY3Rpb24uaW5kZXg7XG4gICAgICAgIGlmIChjb250ZXh0Q2FjaGUucmFuZ2VDb3VudCAhPSBlZGl0b3IubXVsdGlTZWxlY3QucmFuZ2VDb3VudClcbiAgICAgICAgICAgIGNvbnRleHRDYWNoZSA9IHtyYW5nZUNvdW50OiBlZGl0b3IubXVsdGlTZWxlY3QucmFuZ2VDb3VudH07XG4gICAgfVxuICAgIGlmIChjb250ZXh0Q2FjaGVbaWRdKVxuICAgICAgICByZXR1cm4gY29udGV4dCA9IGNvbnRleHRDYWNoZVtpZF07XG4gICAgY29udGV4dCA9IGNvbnRleHRDYWNoZVtpZF0gPSB7XG4gICAgICAgIGF1dG9JbnNlcnRlZEJyYWNrZXRzOiAwLFxuICAgICAgICBhdXRvSW5zZXJ0ZWRSb3c6IC0xLFxuICAgICAgICBhdXRvSW5zZXJ0ZWRMaW5lRW5kOiBcIlwiLFxuICAgICAgICBtYXliZUluc2VydGVkQnJhY2tldHM6IDAsXG4gICAgICAgIG1heWJlSW5zZXJ0ZWRSb3c6IC0xLFxuICAgICAgICBtYXliZUluc2VydGVkTGluZVN0YXJ0OiBcIlwiLFxuICAgICAgICBtYXliZUluc2VydGVkTGluZUVuZDogXCJcIlxuICAgIH07XG59O1xuXG52YXIgZ2V0V3JhcHBlZCA9IGZ1bmN0aW9uKHNlbGVjdGlvbiwgc2VsZWN0ZWQsIG9wZW5pbmcsIGNsb3NpbmcpIHtcbiAgICB2YXIgcm93RGlmZiA9IHNlbGVjdGlvbi5lbmQucm93IC0gc2VsZWN0aW9uLnN0YXJ0LnJvdztcbiAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiBvcGVuaW5nICsgc2VsZWN0ZWQgKyBjbG9zaW5nLFxuICAgICAgICBzZWxlY3Rpb246IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5zdGFydC5jb2x1bW4gKyAxLFxuICAgICAgICAgICAgICAgIHJvd0RpZmYsXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uLmVuZC5jb2x1bW4gKyAocm93RGlmZiA/IDAgOiAxKVxuICAgICAgICAgICAgXVxuICAgIH07XG59O1xuXG52YXIgQ3N0eWxlQmVoYXZpb3VyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5hZGQoXCJicmFjZXNcIiwgXCJpbnNlcnRpb25cIiwgZnVuY3Rpb24oc3RhdGUsIGFjdGlvbiwgZWRpdG9yLCBzZXNzaW9uLCB0ZXh0KSB7XG4gICAgICAgIHZhciBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yUG9zaXRpb24oKTtcbiAgICAgICAgdmFyIGxpbmUgPSBzZXNzaW9uLmRvYy5nZXRMaW5lKGN1cnNvci5yb3cpO1xuICAgICAgICBpZiAodGV4dCA9PSAneycpIHtcbiAgICAgICAgICAgIGluaXRDb250ZXh0KGVkaXRvcik7XG4gICAgICAgICAgICB2YXIgc2VsZWN0aW9uID0gZWRpdG9yLmdldFNlbGVjdGlvblJhbmdlKCk7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWQgPSBzZXNzaW9uLmRvYy5nZXRUZXh0UmFuZ2Uoc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZCAhPT0gXCJcIiAmJiBzZWxlY3RlZCAhPT0gXCJ7XCIgJiYgZWRpdG9yLmdldFdyYXBCZWhhdmlvdXJzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFdyYXBwZWQoc2VsZWN0aW9uLCBzZWxlY3RlZCwgJ3snLCAnfScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChDc3R5bGVCZWhhdmlvdXIuaXNTYW5lSW5zZXJ0aW9uKGVkaXRvciwgc2Vzc2lvbikpIHtcbiAgICAgICAgICAgICAgICBpZiAoL1tcXF1cXH1cXCldLy50ZXN0KGxpbmVbY3Vyc29yLmNvbHVtbl0pIHx8IGVkaXRvci5pbk11bHRpU2VsZWN0TW9kZSkge1xuICAgICAgICAgICAgICAgICAgICBDc3R5bGVCZWhhdmlvdXIucmVjb3JkQXV0b0luc2VydChlZGl0b3IsIHNlc3Npb24sIFwifVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICd7fScsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFsxLCAxXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIENzdHlsZUJlaGF2aW91ci5yZWNvcmRNYXliZUluc2VydChlZGl0b3IsIHNlc3Npb24sIFwie1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICd7JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogWzEsIDFdXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRleHQgPT0gJ30nKSB7XG4gICAgICAgICAgICBpbml0Q29udGV4dChlZGl0b3IpO1xuICAgICAgICAgICAgdmFyIHJpZ2h0Q2hhciA9IGxpbmUuc3Vic3RyaW5nKGN1cnNvci5jb2x1bW4sIGN1cnNvci5jb2x1bW4gKyAxKTtcbiAgICAgICAgICAgIGlmIChyaWdodENoYXIgPT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoaW5nID0gc2Vzc2lvbi4kZmluZE9wZW5pbmdCcmFja2V0KCd9Jywge2NvbHVtbjogY3Vyc29yLmNvbHVtbiArIDEsIHJvdzogY3Vyc29yLnJvd30pO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZyAhPT0gbnVsbCAmJiBDc3R5bGVCZWhhdmlvdXIuaXNBdXRvSW5zZXJ0ZWRDbG9zaW5nKGN1cnNvciwgbGluZSwgdGV4dCkpIHtcbiAgICAgICAgICAgICAgICAgICAgQ3N0eWxlQmVoYXZpb3VyLnBvcEF1dG9JbnNlcnRlZENsb3NpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBbMSwgMV1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGV4dCA9PSBcIlxcblwiIHx8IHRleHQgPT0gXCJcXHJcXG5cIikge1xuICAgICAgICAgICAgaW5pdENvbnRleHQoZWRpdG9yKTtcbiAgICAgICAgICAgIHZhciBjbG9zaW5nID0gXCJcIjtcbiAgICAgICAgICAgIGlmIChDc3R5bGVCZWhhdmlvdXIuaXNNYXliZUluc2VydGVkQ2xvc2luZyhjdXJzb3IsIGxpbmUpKSB7XG4gICAgICAgICAgICAgICAgY2xvc2luZyA9IGxhbmcuc3RyaW5nUmVwZWF0KFwifVwiLCBjb250ZXh0Lm1heWJlSW5zZXJ0ZWRCcmFja2V0cyk7XG4gICAgICAgICAgICAgICAgQ3N0eWxlQmVoYXZpb3VyLmNsZWFyTWF5YmVJbnNlcnRlZENsb3NpbmcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByaWdodENoYXIgPSBsaW5lLnN1YnN0cmluZyhjdXJzb3IuY29sdW1uLCBjdXJzb3IuY29sdW1uICsgMSk7XG4gICAgICAgICAgICBpZiAocmlnaHRDaGFyID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3BlbkJyYWNlUG9zID0gc2Vzc2lvbi5maW5kTWF0Y2hpbmdCcmFja2V0KHtyb3c6IGN1cnNvci5yb3csIGNvbHVtbjogY3Vyc29yLmNvbHVtbisxfSwgJ30nKTtcbiAgICAgICAgICAgICAgICBpZiAoIW9wZW5CcmFjZVBvcylcbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIHZhciBuZXh0X2luZGVudCA9IHRoaXMuJGdldEluZGVudChzZXNzaW9uLmdldExpbmUob3BlbkJyYWNlUG9zLnJvdykpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjbG9zaW5nKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRfaW5kZW50ID0gdGhpcy4kZ2V0SW5kZW50KGxpbmUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBDc3R5bGVCZWhhdmlvdXIuY2xlYXJNYXliZUluc2VydGVkQ2xvc2luZygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBpbmRlbnQgPSBuZXh0X2luZGVudCArIHNlc3Npb24uZ2V0VGFiU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGV4dDogJ1xcbicgKyBpbmRlbnQgKyAnXFxuJyArIG5leHRfaW5kZW50ICsgY2xvc2luZyxcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFsxLCBpbmRlbnQubGVuZ3RoLCAxLCBpbmRlbnQubGVuZ3RoXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENzdHlsZUJlaGF2aW91ci5jbGVhck1heWJlSW5zZXJ0ZWRDbG9zaW5nKCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYWRkKFwiYnJhY2VzXCIsIFwiZGVsZXRpb25cIiwgZnVuY3Rpb24oc3RhdGUsIGFjdGlvbiwgZWRpdG9yLCBzZXNzaW9uLCByYW5nZSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSBzZXNzaW9uLmRvYy5nZXRUZXh0UmFuZ2UocmFuZ2UpO1xuICAgICAgICBpZiAoIXJhbmdlLmlzTXVsdGlMaW5lKCkgJiYgc2VsZWN0ZWQgPT0gJ3snKSB7XG4gICAgICAgICAgICBpbml0Q29udGV4dChlZGl0b3IpO1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBzZXNzaW9uLmRvYy5nZXRMaW5lKHJhbmdlLnN0YXJ0LnJvdyk7XG4gICAgICAgICAgICB2YXIgcmlnaHRDaGFyID0gbGluZS5zdWJzdHJpbmcocmFuZ2UuZW5kLmNvbHVtbiwgcmFuZ2UuZW5kLmNvbHVtbiArIDEpO1xuICAgICAgICAgICAgaWYgKHJpZ2h0Q2hhciA9PSAnfScpIHtcbiAgICAgICAgICAgICAgICByYW5nZS5lbmQuY29sdW1uKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhbmdlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0Lm1heWJlSW5zZXJ0ZWRCcmFja2V0cy0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZChcInBhcmVuc1wiLCBcImluc2VydGlvblwiLCBmdW5jdGlvbihzdGF0ZSwgYWN0aW9uLCBlZGl0b3IsIHNlc3Npb24sIHRleHQpIHtcbiAgICAgICAgaWYgKHRleHQgPT0gJygnKSB7XG4gICAgICAgICAgICBpbml0Q29udGV4dChlZGl0b3IpO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3Rpb25SYW5nZSgpO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gc2Vzc2lvbi5kb2MuZ2V0VGV4dFJhbmdlKHNlbGVjdGlvbik7XG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWQgIT09IFwiXCIgJiYgZWRpdG9yLmdldFdyYXBCZWhhdmlvdXJzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFdyYXBwZWQoc2VsZWN0aW9uLCBzZWxlY3RlZCwgJygnLCAnKScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChDc3R5bGVCZWhhdmlvdXIuaXNTYW5lSW5zZXJ0aW9uKGVkaXRvciwgc2Vzc2lvbikpIHtcbiAgICAgICAgICAgICAgICBDc3R5bGVCZWhhdmlvdXIucmVjb3JkQXV0b0luc2VydChlZGl0b3IsIHNlc3Npb24sIFwiKVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnKCknLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFsxLCAxXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGV4dCA9PSAnKScpIHtcbiAgICAgICAgICAgIGluaXRDb250ZXh0KGVkaXRvcik7XG4gICAgICAgICAgICB2YXIgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgbGluZSA9IHNlc3Npb24uZG9jLmdldExpbmUoY3Vyc29yLnJvdyk7XG4gICAgICAgICAgICB2YXIgcmlnaHRDaGFyID0gbGluZS5zdWJzdHJpbmcoY3Vyc29yLmNvbHVtbiwgY3Vyc29yLmNvbHVtbiArIDEpO1xuICAgICAgICAgICAgaWYgKHJpZ2h0Q2hhciA9PSAnKScpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hpbmcgPSBzZXNzaW9uLiRmaW5kT3BlbmluZ0JyYWNrZXQoJyknLCB7Y29sdW1uOiBjdXJzb3IuY29sdW1uICsgMSwgcm93OiBjdXJzb3Iucm93fSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nICE9PSBudWxsICYmIENzdHlsZUJlaGF2aW91ci5pc0F1dG9JbnNlcnRlZENsb3NpbmcoY3Vyc29yLCBsaW5lLCB0ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBDc3R5bGVCZWhhdmlvdXIucG9wQXV0b0luc2VydGVkQ2xvc2luZygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFsxLCAxXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGQoXCJwYXJlbnNcIiwgXCJkZWxldGlvblwiLCBmdW5jdGlvbihzdGF0ZSwgYWN0aW9uLCBlZGl0b3IsIHNlc3Npb24sIHJhbmdlKSB7XG4gICAgICAgIHZhciBzZWxlY3RlZCA9IHNlc3Npb24uZG9jLmdldFRleHRSYW5nZShyYW5nZSk7XG4gICAgICAgIGlmICghcmFuZ2UuaXNNdWx0aUxpbmUoKSAmJiBzZWxlY3RlZCA9PSAnKCcpIHtcbiAgICAgICAgICAgIGluaXRDb250ZXh0KGVkaXRvcik7XG4gICAgICAgICAgICB2YXIgbGluZSA9IHNlc3Npb24uZG9jLmdldExpbmUocmFuZ2Uuc3RhcnQucm93KTtcbiAgICAgICAgICAgIHZhciByaWdodENoYXIgPSBsaW5lLnN1YnN0cmluZyhyYW5nZS5zdGFydC5jb2x1bW4gKyAxLCByYW5nZS5zdGFydC5jb2x1bW4gKyAyKTtcbiAgICAgICAgICAgIGlmIChyaWdodENoYXIgPT0gJyknKSB7XG4gICAgICAgICAgICAgICAgcmFuZ2UuZW5kLmNvbHVtbisrO1xuICAgICAgICAgICAgICAgIHJldHVybiByYW5nZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGQoXCJicmFja2V0c1wiLCBcImluc2VydGlvblwiLCBmdW5jdGlvbihzdGF0ZSwgYWN0aW9uLCBlZGl0b3IsIHNlc3Npb24sIHRleHQpIHtcbiAgICAgICAgaWYgKHRleHQgPT0gJ1snKSB7XG4gICAgICAgICAgICBpbml0Q29udGV4dChlZGl0b3IpO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3Rpb25SYW5nZSgpO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gc2Vzc2lvbi5kb2MuZ2V0VGV4dFJhbmdlKHNlbGVjdGlvbik7XG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWQgIT09IFwiXCIgJiYgZWRpdG9yLmdldFdyYXBCZWhhdmlvdXJzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFdyYXBwZWQoc2VsZWN0aW9uLCBzZWxlY3RlZCwgJ1snLCAnXScpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChDc3R5bGVCZWhhdmlvdXIuaXNTYW5lSW5zZXJ0aW9uKGVkaXRvciwgc2Vzc2lvbikpIHtcbiAgICAgICAgICAgICAgICBDc3R5bGVCZWhhdmlvdXIucmVjb3JkQXV0b0luc2VydChlZGl0b3IsIHNlc3Npb24sIFwiXVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnW10nLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFsxLCAxXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGV4dCA9PSAnXScpIHtcbiAgICAgICAgICAgIGluaXRDb250ZXh0KGVkaXRvcik7XG4gICAgICAgICAgICB2YXIgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgbGluZSA9IHNlc3Npb24uZG9jLmdldExpbmUoY3Vyc29yLnJvdyk7XG4gICAgICAgICAgICB2YXIgcmlnaHRDaGFyID0gbGluZS5zdWJzdHJpbmcoY3Vyc29yLmNvbHVtbiwgY3Vyc29yLmNvbHVtbiArIDEpO1xuICAgICAgICAgICAgaWYgKHJpZ2h0Q2hhciA9PSAnXScpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hpbmcgPSBzZXNzaW9uLiRmaW5kT3BlbmluZ0JyYWNrZXQoJ10nLCB7Y29sdW1uOiBjdXJzb3IuY29sdW1uICsgMSwgcm93OiBjdXJzb3Iucm93fSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nICE9PSBudWxsICYmIENzdHlsZUJlaGF2aW91ci5pc0F1dG9JbnNlcnRlZENsb3NpbmcoY3Vyc29yLCBsaW5lLCB0ZXh0KSkge1xuICAgICAgICAgICAgICAgICAgICBDc3R5bGVCZWhhdmlvdXIucG9wQXV0b0luc2VydGVkQ2xvc2luZygpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFsxLCAxXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGQoXCJicmFja2V0c1wiLCBcImRlbGV0aW9uXCIsIGZ1bmN0aW9uKHN0YXRlLCBhY3Rpb24sIGVkaXRvciwgc2Vzc2lvbiwgcmFuZ2UpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gc2Vzc2lvbi5kb2MuZ2V0VGV4dFJhbmdlKHJhbmdlKTtcbiAgICAgICAgaWYgKCFyYW5nZS5pc011bHRpTGluZSgpICYmIHNlbGVjdGVkID09ICdbJykge1xuICAgICAgICAgICAgaW5pdENvbnRleHQoZWRpdG9yKTtcbiAgICAgICAgICAgIHZhciBsaW5lID0gc2Vzc2lvbi5kb2MuZ2V0TGluZShyYW5nZS5zdGFydC5yb3cpO1xuICAgICAgICAgICAgdmFyIHJpZ2h0Q2hhciA9IGxpbmUuc3Vic3RyaW5nKHJhbmdlLnN0YXJ0LmNvbHVtbiArIDEsIHJhbmdlLnN0YXJ0LmNvbHVtbiArIDIpO1xuICAgICAgICAgICAgaWYgKHJpZ2h0Q2hhciA9PSAnXScpIHtcbiAgICAgICAgICAgICAgICByYW5nZS5lbmQuY29sdW1uKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhbmdlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZChcInN0cmluZ19kcXVvdGVzXCIsIFwiaW5zZXJ0aW9uXCIsIGZ1bmN0aW9uKHN0YXRlLCBhY3Rpb24sIGVkaXRvciwgc2Vzc2lvbiwgdGV4dCkge1xuICAgICAgICBpZiAodGV4dCA9PSAnXCInIHx8IHRleHQgPT0gXCInXCIpIHtcbiAgICAgICAgICAgIGluaXRDb250ZXh0KGVkaXRvcik7XG4gICAgICAgICAgICB2YXIgcXVvdGUgPSB0ZXh0O1xuICAgICAgICAgICAgdmFyIHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3Rpb25SYW5nZSgpO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkID0gc2Vzc2lvbi5kb2MuZ2V0VGV4dFJhbmdlKHNlbGVjdGlvbik7XG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWQgIT09IFwiXCIgJiYgc2VsZWN0ZWQgIT09IFwiJ1wiICYmIHNlbGVjdGVkICE9ICdcIicgJiYgZWRpdG9yLmdldFdyYXBCZWhhdmlvdXJzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldFdyYXBwZWQoc2VsZWN0aW9uLCBzZWxlY3RlZCwgcXVvdGUsIHF1b3RlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIXNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gc2Vzc2lvbi5kb2MuZ2V0TGluZShjdXJzb3Iucm93KTtcbiAgICAgICAgICAgICAgICB2YXIgbGVmdENoYXIgPSBsaW5lLnN1YnN0cmluZyhjdXJzb3IuY29sdW1uLTEsIGN1cnNvci5jb2x1bW4pO1xuICAgICAgICAgICAgICAgIHZhciByaWdodENoYXIgPSBsaW5lLnN1YnN0cmluZyhjdXJzb3IuY29sdW1uLCBjdXJzb3IuY29sdW1uICsgMSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHRva2VuID0gc2Vzc2lvbi5nZXRUb2tlbkF0KGN1cnNvci5yb3csIGN1cnNvci5jb2x1bW4pO1xuICAgICAgICAgICAgICAgIHZhciByaWdodFRva2VuID0gc2Vzc2lvbi5nZXRUb2tlbkF0KGN1cnNvci5yb3csIGN1cnNvci5jb2x1bW4gKyAxKTtcbiAgICAgICAgICAgICAgICBpZiAobGVmdENoYXIgPT0gXCJcXFxcXCIgJiYgdG9rZW4gJiYgL2VzY2FwZS8udGVzdCh0b2tlbi50eXBlKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHN0cmluZ0JlZm9yZSA9IHRva2VuICYmIC9zdHJpbmd8ZXNjYXBlLy50ZXN0KHRva2VuLnR5cGUpO1xuICAgICAgICAgICAgICAgIHZhciBzdHJpbmdBZnRlciA9ICFyaWdodFRva2VuIHx8IC9zdHJpbmd8ZXNjYXBlLy50ZXN0KHJpZ2h0VG9rZW4udHlwZSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHBhaXI7XG4gICAgICAgICAgICAgICAgaWYgKHJpZ2h0Q2hhciA9PSBxdW90ZSkge1xuICAgICAgICAgICAgICAgICAgICBwYWlyID0gc3RyaW5nQmVmb3JlICE9PSBzdHJpbmdBZnRlcjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaW5nQmVmb3JlICYmICFzdHJpbmdBZnRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyB3cmFwIHN0cmluZyB3aXRoIGRpZmZlcmVudCBxdW90ZVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RyaW5nQmVmb3JlICYmIHN0cmluZ0FmdGVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIGRvIG5vdCBwYWlyIHF1b3RlcyBpbnNpZGUgc3RyaW5nc1xuICAgICAgICAgICAgICAgICAgICB2YXIgd29yZFJlID0gc2Vzc2lvbi4kbW9kZS50b2tlblJlO1xuICAgICAgICAgICAgICAgICAgICB3b3JkUmUubGFzdEluZGV4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzV29yZEJlZm9yZSA9IHdvcmRSZS50ZXN0KGxlZnRDaGFyKTtcbiAgICAgICAgICAgICAgICAgICAgd29yZFJlLmxhc3RJbmRleCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc1dvcmRBZnRlciA9IHdvcmRSZS50ZXN0KGxlZnRDaGFyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzV29yZEJlZm9yZSB8fCBpc1dvcmRBZnRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBiZWZvcmUgb3IgYWZ0ZXIgYWxwaGFudW1lcmljXG4gICAgICAgICAgICAgICAgICAgIGlmIChyaWdodENoYXIgJiYgIS9bXFxzOywufSlcXF1cXFxcXS8udGVzdChyaWdodENoYXIpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIHRoZXJlIGlzIHJpZ2h0Q2hhciBhbmQgaXQgaXNuJ3QgY2xvc2luZ1xuICAgICAgICAgICAgICAgICAgICBwYWlyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogcGFpciA/IHF1b3RlICsgcXVvdGUgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFsxLDFdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGQoXCJzdHJpbmdfZHF1b3Rlc1wiLCBcImRlbGV0aW9uXCIsIGZ1bmN0aW9uKHN0YXRlLCBhY3Rpb24sIGVkaXRvciwgc2Vzc2lvbiwgcmFuZ2UpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gc2Vzc2lvbi5kb2MuZ2V0VGV4dFJhbmdlKHJhbmdlKTtcbiAgICAgICAgaWYgKCFyYW5nZS5pc011bHRpTGluZSgpICYmIChzZWxlY3RlZCA9PSAnXCInIHx8IHNlbGVjdGVkID09IFwiJ1wiKSkge1xuICAgICAgICAgICAgaW5pdENvbnRleHQoZWRpdG9yKTtcbiAgICAgICAgICAgIHZhciBsaW5lID0gc2Vzc2lvbi5kb2MuZ2V0TGluZShyYW5nZS5zdGFydC5yb3cpO1xuICAgICAgICAgICAgdmFyIHJpZ2h0Q2hhciA9IGxpbmUuc3Vic3RyaW5nKHJhbmdlLnN0YXJ0LmNvbHVtbiArIDEsIHJhbmdlLnN0YXJ0LmNvbHVtbiArIDIpO1xuICAgICAgICAgICAgaWYgKHJpZ2h0Q2hhciA9PSBzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIHJhbmdlLmVuZC5jb2x1bW4rKztcbiAgICAgICAgICAgICAgICByZXR1cm4gcmFuZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxufTtcblxuICAgIFxuQ3N0eWxlQmVoYXZpb3VyLmlzU2FuZUluc2VydGlvbiA9IGZ1bmN0aW9uKGVkaXRvciwgc2Vzc2lvbikge1xuICAgIHZhciBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29yUG9zaXRpb24oKTtcbiAgICB2YXIgaXRlcmF0b3IgPSBuZXcgVG9rZW5JdGVyYXRvcihzZXNzaW9uLCBjdXJzb3Iucm93LCBjdXJzb3IuY29sdW1uKTtcbiAgICBpZiAoIXRoaXMuJG1hdGNoVG9rZW5UeXBlKGl0ZXJhdG9yLmdldEN1cnJlbnRUb2tlbigpIHx8IFwidGV4dFwiLCBTQUZFX0lOU0VSVF9JTl9UT0tFTlMpKSB7XG4gICAgICAgIHZhciBpdGVyYXRvcjIgPSBuZXcgVG9rZW5JdGVyYXRvcihzZXNzaW9uLCBjdXJzb3Iucm93LCBjdXJzb3IuY29sdW1uICsgMSk7XG4gICAgICAgIGlmICghdGhpcy4kbWF0Y2hUb2tlblR5cGUoaXRlcmF0b3IyLmdldEN1cnJlbnRUb2tlbigpIHx8IFwidGV4dFwiLCBTQUZFX0lOU0VSVF9JTl9UT0tFTlMpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpdGVyYXRvci5zdGVwRm9yd2FyZCgpO1xuICAgIHJldHVybiBpdGVyYXRvci5nZXRDdXJyZW50VG9rZW5Sb3coKSAhPT0gY3Vyc29yLnJvdyB8fFxuICAgICAgICB0aGlzLiRtYXRjaFRva2VuVHlwZShpdGVyYXRvci5nZXRDdXJyZW50VG9rZW4oKSB8fCBcInRleHRcIiwgU0FGRV9JTlNFUlRfQkVGT1JFX1RPS0VOUyk7XG59O1xuXG5Dc3R5bGVCZWhhdmlvdXIuJG1hdGNoVG9rZW5UeXBlID0gZnVuY3Rpb24odG9rZW4sIHR5cGVzKSB7XG4gICAgcmV0dXJuIHR5cGVzLmluZGV4T2YodG9rZW4udHlwZSB8fCB0b2tlbikgPiAtMTtcbn07XG5cbkNzdHlsZUJlaGF2aW91ci5yZWNvcmRBdXRvSW5zZXJ0ID0gZnVuY3Rpb24oZWRpdG9yLCBzZXNzaW9uLCBicmFja2V0KSB7XG4gICAgdmFyIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpO1xuICAgIHZhciBsaW5lID0gc2Vzc2lvbi5kb2MuZ2V0TGluZShjdXJzb3Iucm93KTtcbiAgICBpZiAoIXRoaXMuaXNBdXRvSW5zZXJ0ZWRDbG9zaW5nKGN1cnNvciwgbGluZSwgY29udGV4dC5hdXRvSW5zZXJ0ZWRMaW5lRW5kWzBdKSlcbiAgICAgICAgY29udGV4dC5hdXRvSW5zZXJ0ZWRCcmFja2V0cyA9IDA7XG4gICAgY29udGV4dC5hdXRvSW5zZXJ0ZWRSb3cgPSBjdXJzb3Iucm93O1xuICAgIGNvbnRleHQuYXV0b0luc2VydGVkTGluZUVuZCA9IGJyYWNrZXQgKyBsaW5lLnN1YnN0cihjdXJzb3IuY29sdW1uKTtcbiAgICBjb250ZXh0LmF1dG9JbnNlcnRlZEJyYWNrZXRzKys7XG59O1xuXG5Dc3R5bGVCZWhhdmlvdXIucmVjb3JkTWF5YmVJbnNlcnQgPSBmdW5jdGlvbihlZGl0b3IsIHNlc3Npb24sIGJyYWNrZXQpIHtcbiAgICB2YXIgY3Vyc29yID0gZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKCk7XG4gICAgdmFyIGxpbmUgPSBzZXNzaW9uLmRvYy5nZXRMaW5lKGN1cnNvci5yb3cpO1xuICAgIGlmICghdGhpcy5pc01heWJlSW5zZXJ0ZWRDbG9zaW5nKGN1cnNvciwgbGluZSkpXG4gICAgICAgIGNvbnRleHQubWF5YmVJbnNlcnRlZEJyYWNrZXRzID0gMDtcbiAgICBjb250ZXh0Lm1heWJlSW5zZXJ0ZWRSb3cgPSBjdXJzb3Iucm93O1xuICAgIGNvbnRleHQubWF5YmVJbnNlcnRlZExpbmVTdGFydCA9IGxpbmUuc3Vic3RyKDAsIGN1cnNvci5jb2x1bW4pICsgYnJhY2tldDtcbiAgICBjb250ZXh0Lm1heWJlSW5zZXJ0ZWRMaW5lRW5kID0gbGluZS5zdWJzdHIoY3Vyc29yLmNvbHVtbik7XG4gICAgY29udGV4dC5tYXliZUluc2VydGVkQnJhY2tldHMrKztcbn07XG5cbkNzdHlsZUJlaGF2aW91ci5pc0F1dG9JbnNlcnRlZENsb3NpbmcgPSBmdW5jdGlvbihjdXJzb3IsIGxpbmUsIGJyYWNrZXQpIHtcbiAgICByZXR1cm4gY29udGV4dC5hdXRvSW5zZXJ0ZWRCcmFja2V0cyA+IDAgJiZcbiAgICAgICAgY3Vyc29yLnJvdyA9PT0gY29udGV4dC5hdXRvSW5zZXJ0ZWRSb3cgJiZcbiAgICAgICAgYnJhY2tldCA9PT0gY29udGV4dC5hdXRvSW5zZXJ0ZWRMaW5lRW5kWzBdICYmXG4gICAgICAgIGxpbmUuc3Vic3RyKGN1cnNvci5jb2x1bW4pID09PSBjb250ZXh0LmF1dG9JbnNlcnRlZExpbmVFbmQ7XG59O1xuXG5Dc3R5bGVCZWhhdmlvdXIuaXNNYXliZUluc2VydGVkQ2xvc2luZyA9IGZ1bmN0aW9uKGN1cnNvciwgbGluZSkge1xuICAgIHJldHVybiBjb250ZXh0Lm1heWJlSW5zZXJ0ZWRCcmFja2V0cyA+IDAgJiZcbiAgICAgICAgY3Vyc29yLnJvdyA9PT0gY29udGV4dC5tYXliZUluc2VydGVkUm93ICYmXG4gICAgICAgIGxpbmUuc3Vic3RyKGN1cnNvci5jb2x1bW4pID09PSBjb250ZXh0Lm1heWJlSW5zZXJ0ZWRMaW5lRW5kICYmXG4gICAgICAgIGxpbmUuc3Vic3RyKDAsIGN1cnNvci5jb2x1bW4pID09IGNvbnRleHQubWF5YmVJbnNlcnRlZExpbmVTdGFydDtcbn07XG5cbkNzdHlsZUJlaGF2aW91ci5wb3BBdXRvSW5zZXJ0ZWRDbG9zaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgY29udGV4dC5hdXRvSW5zZXJ0ZWRMaW5lRW5kID0gY29udGV4dC5hdXRvSW5zZXJ0ZWRMaW5lRW5kLnN1YnN0cigxKTtcbiAgICBjb250ZXh0LmF1dG9JbnNlcnRlZEJyYWNrZXRzLS07XG59O1xuXG5Dc3R5bGVCZWhhdmlvdXIuY2xlYXJNYXliZUluc2VydGVkQ2xvc2luZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgIGNvbnRleHQubWF5YmVJbnNlcnRlZEJyYWNrZXRzID0gMDtcbiAgICAgICAgY29udGV4dC5tYXliZUluc2VydGVkUm93ID0gLTE7XG4gICAgfVxufTtcblxuXG5cbm9vcC5pbmhlcml0cyhDc3R5bGVCZWhhdmlvdXIsIEJlaGF2aW91cik7XG5cbmV4cG9ydHMuQ3N0eWxlQmVoYXZpb3VyID0gQ3N0eWxlQmVoYXZpb3VyO1xufSk7XG5cbmFjZS5kZWZpbmUoXCJhY2UvbW9kZS9mb2xkaW5nL2NzdHlsZVwiLFtcInJlcXVpcmVcIixcImV4cG9ydHNcIixcIm1vZHVsZVwiLFwiYWNlL2xpYi9vb3BcIixcImFjZS9yYW5nZVwiLFwiYWNlL21vZGUvZm9sZGluZy9mb2xkX21vZGVcIl0sIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiLi4vLi4vbGliL29vcFwiKTtcbnZhciBSYW5nZSA9IHJlcXVpcmUoXCIuLi8uLi9yYW5nZVwiKS5SYW5nZTtcbnZhciBCYXNlRm9sZE1vZGUgPSByZXF1aXJlKFwiLi9mb2xkX21vZGVcIikuRm9sZE1vZGU7XG5cbnZhciBGb2xkTW9kZSA9IGV4cG9ydHMuRm9sZE1vZGUgPSBmdW5jdGlvbihjb21tZW50UmVnZXgpIHtcbiAgICBpZiAoY29tbWVudFJlZ2V4KSB7XG4gICAgICAgIHRoaXMuZm9sZGluZ1N0YXJ0TWFya2VyID0gbmV3IFJlZ0V4cChcbiAgICAgICAgICAgIHRoaXMuZm9sZGluZ1N0YXJ0TWFya2VyLnNvdXJjZS5yZXBsYWNlKC9cXHxbXnxdKj8kLywgXCJ8XCIgKyBjb21tZW50UmVnZXguc3RhcnQpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuZm9sZGluZ1N0b3BNYXJrZXIgPSBuZXcgUmVnRXhwKFxuICAgICAgICAgICAgdGhpcy5mb2xkaW5nU3RvcE1hcmtlci5zb3VyY2UucmVwbGFjZSgvXFx8W158XSo/JC8sIFwifFwiICsgY29tbWVudFJlZ2V4LmVuZClcbiAgICAgICAgKTtcbiAgICB9XG59O1xub29wLmluaGVyaXRzKEZvbGRNb2RlLCBCYXNlRm9sZE1vZGUpO1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgXG4gICAgdGhpcy5mb2xkaW5nU3RhcnRNYXJrZXIgPSAvKFxce3xcXFspW15cXH1cXF1dKiR8XlxccyooXFwvXFwqKS87XG4gICAgdGhpcy5mb2xkaW5nU3RvcE1hcmtlciA9IC9eW15cXFtcXHtdKihcXH18XFxdKXxeW1xcc1xcKl0qKFxcKlxcLykvO1xuICAgIHRoaXMuc2luZ2xlTGluZUJsb2NrQ29tbWVudFJlPSAvXlxccyooXFwvXFwqKS4qXFwqXFwvXFxzKiQvO1xuICAgIHRoaXMudHJpcGxlU3RhckJsb2NrQ29tbWVudFJlID0gL15cXHMqKFxcL1xcKlxcKlxcKikuKlxcKlxcL1xccyokLztcbiAgICB0aGlzLnN0YXJ0UmVnaW9uUmUgPSAvXlxccyooXFwvXFwqfFxcL1xcLykjP3JlZ2lvblxcYi87XG4gICAgdGhpcy5fZ2V0Rm9sZFdpZGdldEJhc2UgPSB0aGlzLmdldEZvbGRXaWRnZXQ7XG4gICAgdGhpcy5nZXRGb2xkV2lkZ2V0ID0gZnVuY3Rpb24oc2Vzc2lvbiwgZm9sZFN0eWxlLCByb3cpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBzZXNzaW9uLmdldExpbmUocm93KTtcbiAgICBcbiAgICAgICAgaWYgKHRoaXMuc2luZ2xlTGluZUJsb2NrQ29tbWVudFJlLnRlc3QobGluZSkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5zdGFydFJlZ2lvblJlLnRlc3QobGluZSkgJiYgIXRoaXMudHJpcGxlU3RhckJsb2NrQ29tbWVudFJlLnRlc3QobGluZSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICBcbiAgICAgICAgdmFyIGZ3ID0gdGhpcy5fZ2V0Rm9sZFdpZGdldEJhc2Uoc2Vzc2lvbiwgZm9sZFN0eWxlLCByb3cpO1xuICAgIFxuICAgICAgICBpZiAoIWZ3ICYmIHRoaXMuc3RhcnRSZWdpb25SZS50ZXN0KGxpbmUpKVxuICAgICAgICAgICAgcmV0dXJuIFwic3RhcnRcIjsgLy8gbGluZUNvbW1lbnRSZWdpb25TdGFydFxuICAgIFxuICAgICAgICByZXR1cm4gZnc7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0Rm9sZFdpZGdldFJhbmdlID0gZnVuY3Rpb24oc2Vzc2lvbiwgZm9sZFN0eWxlLCByb3csIGZvcmNlTXVsdGlsaW5lKSB7XG4gICAgICAgIHZhciBsaW5lID0gc2Vzc2lvbi5nZXRMaW5lKHJvdyk7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5zdGFydFJlZ2lvblJlLnRlc3QobGluZSkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21tZW50UmVnaW9uQmxvY2soc2Vzc2lvbiwgbGluZSwgcm93KTtcbiAgICAgICAgXG4gICAgICAgIHZhciBtYXRjaCA9IGxpbmUubWF0Y2godGhpcy5mb2xkaW5nU3RhcnRNYXJrZXIpO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHZhciBpID0gbWF0Y2guaW5kZXg7XG5cbiAgICAgICAgICAgIGlmIChtYXRjaFsxXSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vcGVuaW5nQnJhY2tldEJsb2NrKHNlc3Npb24sIG1hdGNoWzFdLCByb3csIGkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2Vzc2lvbi5nZXRDb21tZW50Rm9sZFJhbmdlKHJvdywgaSArIG1hdGNoWzBdLmxlbmd0aCwgMSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyYW5nZSAmJiAhcmFuZ2UuaXNNdWx0aUxpbmUoKSkge1xuICAgICAgICAgICAgICAgIGlmIChmb3JjZU11bHRpbGluZSkge1xuICAgICAgICAgICAgICAgICAgICByYW5nZSA9IHRoaXMuZ2V0U2VjdGlvblJhbmdlKHNlc3Npb24sIHJvdyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmb2xkU3R5bGUgIT0gXCJhbGxcIilcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gcmFuZ2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZm9sZFN0eWxlID09PSBcIm1hcmtiZWdpblwiKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciBtYXRjaCA9IGxpbmUubWF0Y2godGhpcy5mb2xkaW5nU3RvcE1hcmtlcik7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgdmFyIGkgPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKG1hdGNoWzFdKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsb3NpbmdCcmFja2V0QmxvY2soc2Vzc2lvbiwgbWF0Y2hbMV0sIHJvdywgaSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzZXNzaW9uLmdldENvbW1lbnRGb2xkUmFuZ2Uocm93LCBpLCAtMSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIHRoaXMuZ2V0U2VjdGlvblJhbmdlID0gZnVuY3Rpb24oc2Vzc2lvbiwgcm93KSB7XG4gICAgICAgIHZhciBsaW5lID0gc2Vzc2lvbi5nZXRMaW5lKHJvdyk7XG4gICAgICAgIHZhciBzdGFydEluZGVudCA9IGxpbmUuc2VhcmNoKC9cXFMvKTtcbiAgICAgICAgdmFyIHN0YXJ0Um93ID0gcm93O1xuICAgICAgICB2YXIgc3RhcnRDb2x1bW4gPSBsaW5lLmxlbmd0aDtcbiAgICAgICAgcm93ID0gcm93ICsgMTtcbiAgICAgICAgdmFyIGVuZFJvdyA9IHJvdztcbiAgICAgICAgdmFyIG1heFJvdyA9IHNlc3Npb24uZ2V0TGVuZ3RoKCk7XG4gICAgICAgIHdoaWxlICgrK3JvdyA8IG1heFJvdykge1xuICAgICAgICAgICAgbGluZSA9IHNlc3Npb24uZ2V0TGluZShyb3cpO1xuICAgICAgICAgICAgdmFyIGluZGVudCA9IGxpbmUuc2VhcmNoKC9cXFMvKTtcbiAgICAgICAgICAgIGlmIChpbmRlbnQgPT09IC0xKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgIChzdGFydEluZGVudCA+IGluZGVudClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIHZhciBzdWJSYW5nZSA9IHRoaXMuZ2V0Rm9sZFdpZGdldFJhbmdlKHNlc3Npb24sIFwiYWxsXCIsIHJvdyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChzdWJSYW5nZSkge1xuICAgICAgICAgICAgICAgIGlmIChzdWJSYW5nZS5zdGFydC5yb3cgPD0gc3RhcnRSb3cpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdWJSYW5nZS5pc011bHRpTGluZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJvdyA9IHN1YlJhbmdlLmVuZC5yb3c7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGFydEluZGVudCA9PSBpbmRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZW5kUm93ID0gcm93O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbmV3IFJhbmdlKHN0YXJ0Um93LCBzdGFydENvbHVtbiwgZW5kUm93LCBzZXNzaW9uLmdldExpbmUoZW5kUm93KS5sZW5ndGgpO1xuICAgIH07XG4gICAgdGhpcy5nZXRDb21tZW50UmVnaW9uQmxvY2sgPSBmdW5jdGlvbihzZXNzaW9uLCBsaW5lLCByb3cpIHtcbiAgICAgICAgdmFyIHN0YXJ0Q29sdW1uID0gbGluZS5zZWFyY2goL1xccyokLyk7XG4gICAgICAgIHZhciBtYXhSb3cgPSBzZXNzaW9uLmdldExlbmd0aCgpO1xuICAgICAgICB2YXIgc3RhcnRSb3cgPSByb3c7XG4gICAgICAgIFxuICAgICAgICB2YXIgcmUgPSAvXlxccyooPzpcXC9cXCp8XFwvXFwvfC0tKSM/KGVuZCk/cmVnaW9uXFxiLztcbiAgICAgICAgdmFyIGRlcHRoID0gMTtcbiAgICAgICAgd2hpbGUgKCsrcm93IDwgbWF4Um93KSB7XG4gICAgICAgICAgICBsaW5lID0gc2Vzc2lvbi5nZXRMaW5lKHJvdyk7XG4gICAgICAgICAgICB2YXIgbSA9IHJlLmV4ZWMobGluZSk7XG4gICAgICAgICAgICBpZiAoIW0pIGNvbnRpbnVlO1xuICAgICAgICAgICAgaWYgKG1bMV0pIGRlcHRoLS07XG4gICAgICAgICAgICBlbHNlIGRlcHRoKys7XG5cbiAgICAgICAgICAgIGlmICghZGVwdGgpIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVuZFJvdyA9IHJvdztcbiAgICAgICAgaWYgKGVuZFJvdyA+IHN0YXJ0Um93KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFJhbmdlKHN0YXJ0Um93LCBzdGFydENvbHVtbiwgZW5kUm93LCBsaW5lLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KS5jYWxsKEZvbGRNb2RlLnByb3RvdHlwZSk7XG5cbn0pO1xuXG5hY2UuZGVmaW5lKFwiYWNlL21vZGUvamF2YXNjcmlwdFwiLFtcInJlcXVpcmVcIixcImV4cG9ydHNcIixcIm1vZHVsZVwiLFwiYWNlL2xpYi9vb3BcIixcImFjZS9tb2RlL3RleHRcIixcImFjZS9tb2RlL2phdmFzY3JpcHRfaGlnaGxpZ2h0X3J1bGVzXCIsXCJhY2UvbW9kZS9tYXRjaGluZ19icmFjZV9vdXRkZW50XCIsXCJhY2UvcmFuZ2VcIixcImFjZS93b3JrZXIvd29ya2VyX2NsaWVudFwiLFwiYWNlL21vZGUvYmVoYXZpb3VyL2NzdHlsZVwiLFwiYWNlL21vZGUvZm9sZGluZy9jc3R5bGVcIl0sIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBvb3AgPSByZXF1aXJlKFwiLi4vbGliL29vcFwiKTtcbnZhciBUZXh0TW9kZSA9IHJlcXVpcmUoXCIuL3RleHRcIikuTW9kZTtcbnZhciBKYXZhU2NyaXB0SGlnaGxpZ2h0UnVsZXMgPSByZXF1aXJlKFwiLi9qYXZhc2NyaXB0X2hpZ2hsaWdodF9ydWxlc1wiKS5KYXZhU2NyaXB0SGlnaGxpZ2h0UnVsZXM7XG52YXIgTWF0Y2hpbmdCcmFjZU91dGRlbnQgPSByZXF1aXJlKFwiLi9tYXRjaGluZ19icmFjZV9vdXRkZW50XCIpLk1hdGNoaW5nQnJhY2VPdXRkZW50O1xudmFyIFJhbmdlID0gcmVxdWlyZShcIi4uL3JhbmdlXCIpLlJhbmdlO1xudmFyIFdvcmtlckNsaWVudCA9IHJlcXVpcmUoXCIuLi93b3JrZXIvd29ya2VyX2NsaWVudFwiKS5Xb3JrZXJDbGllbnQ7XG52YXIgQ3N0eWxlQmVoYXZpb3VyID0gcmVxdWlyZShcIi4vYmVoYXZpb3VyL2NzdHlsZVwiKS5Dc3R5bGVCZWhhdmlvdXI7XG52YXIgQ1N0eWxlRm9sZE1vZGUgPSByZXF1aXJlKFwiLi9mb2xkaW5nL2NzdHlsZVwiKS5Gb2xkTW9kZTtcblxudmFyIE1vZGUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLkhpZ2hsaWdodFJ1bGVzID0gSmF2YVNjcmlwdEhpZ2hsaWdodFJ1bGVzO1xuICAgIFxuICAgIHRoaXMuJG91dGRlbnQgPSBuZXcgTWF0Y2hpbmdCcmFjZU91dGRlbnQoKTtcbiAgICB0aGlzLiRiZWhhdmlvdXIgPSBuZXcgQ3N0eWxlQmVoYXZpb3VyKCk7XG4gICAgdGhpcy5mb2xkaW5nUnVsZXMgPSBuZXcgQ1N0eWxlRm9sZE1vZGUoKTtcbn07XG5vb3AuaW5oZXJpdHMoTW9kZSwgVGV4dE1vZGUpO1xuXG4oZnVuY3Rpb24oKSB7XG5cbiAgICB0aGlzLmxpbmVDb21tZW50U3RhcnQgPSBcIi8vXCI7XG4gICAgdGhpcy5ibG9ja0NvbW1lbnQgPSB7c3RhcnQ6IFwiLypcIiwgZW5kOiBcIiovXCJ9O1xuXG4gICAgdGhpcy5nZXROZXh0TGluZUluZGVudCA9IGZ1bmN0aW9uKHN0YXRlLCBsaW5lLCB0YWIpIHtcbiAgICAgICAgdmFyIGluZGVudCA9IHRoaXMuJGdldEluZGVudChsaW5lKTtcblxuICAgICAgICB2YXIgdG9rZW5pemVkTGluZSA9IHRoaXMuZ2V0VG9rZW5pemVyKCkuZ2V0TGluZVRva2VucyhsaW5lLCBzdGF0ZSk7XG4gICAgICAgIHZhciB0b2tlbnMgPSB0b2tlbml6ZWRMaW5lLnRva2VucztcbiAgICAgICAgdmFyIGVuZFN0YXRlID0gdG9rZW5pemVkTGluZS5zdGF0ZTtcblxuICAgICAgICBpZiAodG9rZW5zLmxlbmd0aCAmJiB0b2tlbnNbdG9rZW5zLmxlbmd0aC0xXS50eXBlID09IFwiY29tbWVudFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5kZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YXRlID09IFwic3RhcnRcIiB8fCBzdGF0ZSA9PSBcIm5vX3JlZ2V4XCIpIHtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpbmUubWF0Y2goL14uKig/OlxcYmNhc2VcXGIuKlxcOnxbXFx7XFwoXFxbXSlcXHMqJC8pO1xuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgaW5kZW50ICs9IHRhYjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PSBcImRvYy1zdGFydFwiKSB7XG4gICAgICAgICAgICBpZiAoZW5kU3RhdGUgPT0gXCJzdGFydFwiIHx8IGVuZFN0YXRlID09IFwibm9fcmVnZXhcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1hdGNoID0gbGluZS5tYXRjaCgvXlxccyooXFwvPylcXCovKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaFsxXSkge1xuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgKz0gXCIgXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGluZGVudCArPSBcIiogXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW5kZW50O1xuICAgIH07XG5cbiAgICB0aGlzLmNoZWNrT3V0ZGVudCA9IGZ1bmN0aW9uKHN0YXRlLCBsaW5lLCBpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kb3V0ZGVudC5jaGVja091dGRlbnQobGluZSwgaW5wdXQpO1xuICAgIH07XG5cbiAgICB0aGlzLmF1dG9PdXRkZW50ID0gZnVuY3Rpb24oc3RhdGUsIGRvYywgcm93KSB7XG4gICAgICAgIHRoaXMuJG91dGRlbnQuYXV0b091dGRlbnQoZG9jLCByb3cpO1xuICAgIH07XG5cbiAgICB0aGlzLmNyZWF0ZVdvcmtlciA9IGZ1bmN0aW9uKHNlc3Npb24pIHtcbiAgICAgICAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXJDbGllbnQoW1wiYWNlXCJdLCBcImFjZS9tb2RlL2phdmFzY3JpcHRfd29ya2VyXCIsIFwiSmF2YVNjcmlwdFdvcmtlclwiKTtcbiAgICAgICAgd29ya2VyLmF0dGFjaFRvRG9jdW1lbnQoc2Vzc2lvbi5nZXREb2N1bWVudCgpKTtcblxuICAgICAgICB3b3JrZXIub24oXCJhbm5vdGF0ZVwiLCBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgICBzZXNzaW9uLnNldEFubm90YXRpb25zKHJlc3VsdHMuZGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdvcmtlci5vbihcInRlcm1pbmF0ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlc3Npb24uY2xlYXJBbm5vdGF0aW9ucygpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gd29ya2VyO1xuICAgIH07XG5cbiAgICB0aGlzLiRpZCA9IFwiYWNlL21vZGUvamF2YXNjcmlwdFwiO1xufSkuY2FsbChNb2RlLnByb3RvdHlwZSk7XG5cbmV4cG9ydHMuTW9kZSA9IE1vZGU7XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
