/* */ 
(function(process) {
  "use strict";
  const CSSStyleDeclaration = require('cssstyle').CSSStyleDeclaration;
  const notImplemented = require('./not-implemented');
  const VirtualConsole = require('../virtual-console');
  const define = require('../utils').define;
  const inherits = require('../utils').inheritFrom;
  const EventTarget = require('../living/generated/EventTarget');
  const namedPropertiesWindow = require('../living/named-properties-window');
  const cssom = require('cssom');
  const postMessage = require('../living/post-message');
  const DOMException = require('../web-idl/DOMException');
  const btoa = require('abab').btoa;
  const atob = require('abab').atob;
  const idlUtils = require('../living/generated/utils');
  const internalConstants = require('../living/helpers/internal-constants');
  const createFileReader = require('../living/file-reader');
  const createXMLHttpRequest = require('../living/xmlhttprequest');
  const Document = require('../living/generated/Document');
  const reportException = require('../living/helpers/runtime-script-errors');
  module.exports = Window;
  const dom = require('../living/index');
  const cssSelectorSplitRE = /((?:[^,"']|"[^"]*"|'[^']*')+)/;
  const defaultStyleSheet = cssom.parse(require('./default-stylesheet'));
  dom.Window = Window;
  function Window(options) {
    EventTarget.setup(this);
    const window = this;
    define(window, dom);
    this._core = dom;
    this._globalProxy = this;
    this.__timers = Object.create(null);
    this._parent = this._top = this._globalProxy;
    this._document = Document.create([], {
      core: dom,
      options: {
        parsingMode: options.parsingMode,
        contentType: options.contentType,
        cookieJar: options.cookieJar,
        parser: options.parser,
        url: options.url,
        referrer: options.referrer,
        cookie: options.cookie,
        deferClose: options.deferClose,
        resourceLoader: options.resourceLoader,
        concurrentNodeIterators: options.concurrentNodeIterators,
        pool: options.pool,
        agentOptions: options.agentOptions,
        defaultView: this._globalProxy,
        global: this
      }
    });
    this._sessionHistory = [{
      document: idlUtils.implForWrapper(this._document),
      url: idlUtils.implForWrapper(this._document)._URL,
      stateObject: null
    }];
    this._currentSessionHistoryEntryIndex = 0;
    this._length = 0;
    if (options.virtualConsole) {
      if (options.virtualConsole instanceof VirtualConsole) {
        this._virtualConsole = options.virtualConsole;
      } else {
        throw new TypeError("options.virtualConsole must be a VirtualConsole (from createVirtualConsole)");
      }
    } else {
      this._virtualConsole = new VirtualConsole();
    }
    define(this, {
      get length() {
        return window._length;
      },
      get window() {
        return window._globalProxy;
      },
      get frames() {
        return window._globalProxy;
      },
      get self() {
        return window._globalProxy;
      },
      get parent() {
        return window._parent;
      },
      get top() {
        return window._top;
      },
      get document() {
        return window._document;
      },
      get location() {
        return idlUtils.wrapperForImpl(idlUtils.implForWrapper(window._document)._location);
      },
      get history() {
        return idlUtils.wrapperForImpl(idlUtils.implForWrapper(window._document)._history);
      }
    });
    namedPropertiesWindow.initializeWindow(this, dom.HTMLCollection);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);
    let latestTimerId = 0;
    this.setTimeout = function(fn, ms) {
      const args = [];
      for (let i = 2; i < arguments.length; ++i) {
        args[i - 2] = arguments[i];
      }
      return startTimer(window, setTimeout, clearTimeout, latestTimerId++, fn, ms, args);
    };
    this.setInterval = function(fn, ms) {
      const args = [];
      for (let i = 2; i < arguments.length; ++i) {
        args[i - 2] = arguments[i];
      }
      return startTimer(window, setInterval, clearInterval, latestTimerId++, fn, ms, args);
    };
    this.clearInterval = stopTimer.bind(this, window);
    this.clearTimeout = stopTimer.bind(this, window);
    this.__stopAllTimers = stopAllTimers.bind(this, window);
    this.Image = function(width, height) {
      const element = window._document.createElement("img");
      element.width = width;
      element.height = height;
      return element;
    };
    function wrapConsoleMethod(method) {
      return function() {
        const args = Array.prototype.slice.call(arguments);
        window._virtualConsole.emit.apply(window._virtualConsole, [method].concat(args));
      };
    }
    this.postMessage = postMessage;
    this.atob = function(str) {
      const result = atob(str);
      if (result === null) {
        throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "The string to be decoded contains invalid characters.");
      }
      return result;
    };
    this.btoa = function(str) {
      const result = btoa(str);
      if (result === null) {
        throw new DOMException(DOMException.INVALID_CHARACTER_ERR, "The string to be encoded contains invalid characters.");
      }
      return result;
    };
    this.FileReader = createFileReader(this);
    this.XMLHttpRequest = createXMLHttpRequest(this);
    this.ArrayBuffer = ArrayBuffer;
    this.Int8Array = Int8Array;
    this.Uint8Array = Uint8Array;
    this.Uint8ClampedArray = Uint8ClampedArray;
    this.Int16Array = Int16Array;
    this.Uint16Array = Uint16Array;
    this.Int32Array = Int32Array;
    this.Uint32Array = Uint32Array;
    this.Float32Array = Float32Array;
    this.Float64Array = Float64Array;
    this.stop = function() {
      const manager = idlUtils.implForWrapper(this._document)[internalConstants.requestManager];
      if (manager) {
        manager.close();
      }
    };
    this.close = function() {
      const currentWindow = this;
      (function windowCleaner(windowToClean) {
        for (let i = 0; i < windowToClean.length; i++) {
          windowCleaner(windowToClean[i]);
        }
        if (windowToClean !== currentWindow) {
          windowToClean.close();
        }
      }(this));
      idlUtils.implForWrapper(this)._eventListeners = Object.create(null);
      if (this._document) {
        if (this._document.body) {
          this._document.body.innerHTML = "";
        }
        if (this._document.close) {
          this._document._listeners = Object.create(null);
          this._document.close();
        }
        const doc = this._document;
        delete this._document;
        if (doc[internalConstants.requestManager]) {
          doc[internalConstants.requestManager].close();
        }
      }
      stopAllTimers(currentWindow);
    };
    this.getComputedStyle = function(node) {
      const s = node.style;
      const cs = new CSSStyleDeclaration();
      const forEach = Array.prototype.forEach;
      function setPropertiesFromRule(rule) {
        if (!rule.selectorText) {
          return;
        }
        const selectors = rule.selectorText.split(cssSelectorSplitRE);
        let matched = false;
        for (const selectorText of selectors) {
          if (selectorText !== "" && selectorText !== "," && !matched && matchesDontThrow(node, selectorText)) {
            matched = true;
            forEach.call(rule.style, (property) => {
              cs.setProperty(property, rule.style.getPropertyValue(property), rule.style.getPropertyPriority(property));
            });
          }
        }
      }
      function readStylesFromStyleSheet(sheet) {
        forEach.call(sheet.cssRules, (rule) => {
          if (rule.media) {
            if (Array.prototype.indexOf.call(rule.media, "screen") !== -1) {
              forEach.call(rule.cssRules, setPropertiesFromRule);
            }
          } else {
            setPropertiesFromRule(rule);
          }
        });
      }
      readStylesFromStyleSheet(defaultStyleSheet);
      forEach.call(node.ownerDocument.styleSheets, readStylesFromStyleSheet);
      forEach.call(s, (property) => {
        cs.setProperty(property, s.getPropertyValue(property), s.getPropertyPriority(property));
      });
      return cs;
    };
    this.console = {
      assert: wrapConsoleMethod("assert"),
      clear: wrapConsoleMethod("clear"),
      count: wrapConsoleMethod("count"),
      debug: wrapConsoleMethod("debug"),
      error: wrapConsoleMethod("error"),
      group: wrapConsoleMethod("group"),
      groupCollapse: wrapConsoleMethod("groupCollapse"),
      groupEnd: wrapConsoleMethod("groupEnd"),
      info: wrapConsoleMethod("info"),
      log: wrapConsoleMethod("log"),
      table: wrapConsoleMethod("table"),
      time: wrapConsoleMethod("time"),
      timeEnd: wrapConsoleMethod("timeEnd"),
      trace: wrapConsoleMethod("trace"),
      warn: wrapConsoleMethod("warn")
    };
    function notImplementedMethod(name) {
      return function() {
        notImplemented(name, window);
      };
    }
    define(this, {
      navigator: {
        get userAgent() {
          return options.userAgent;
        },
        get appName() {
          return "Node.js jsDom";
        },
        get platform() {
          return process.platform;
        },
        get appVersion() {
          return process.version;
        },
        noUI: true,
        get cookieEnabled() {
          return true;
        }
      },
      name: "nodejs",
      innerWidth: 1024,
      innerHeight: 768,
      outerWidth: 1024,
      outerHeight: 768,
      pageXOffset: 0,
      pageYOffset: 0,
      screenX: 0,
      screenY: 0,
      screenLeft: 0,
      screenTop: 0,
      scrollX: 0,
      scrollY: 0,
      scrollTop: 0,
      scrollLeft: 0,
      screen: {
        width: 0,
        height: 0
      },
      alert: notImplementedMethod("window.alert"),
      blur: notImplementedMethod("window.blur"),
      confirm: notImplementedMethod("window.confirm"),
      createPopup: notImplementedMethod("window.createPopup"),
      focus: notImplementedMethod("window.focus"),
      moveBy: notImplementedMethod("window.moveBy"),
      moveTo: notImplementedMethod("window.moveTo"),
      open: notImplementedMethod("window.open"),
      print: notImplementedMethod("window.print"),
      prompt: notImplementedMethod("window.prompt"),
      resizeBy: notImplementedMethod("window.resizeBy"),
      resizeTo: notImplementedMethod("window.resizeTo"),
      scroll: notImplementedMethod("window.scroll"),
      scrollBy: notImplementedMethod("window.scrollBy"),
      scrollTo: notImplementedMethod("window.scrollTo"),
      toString: () => {
        return "[object Window]";
      }
    });
    process.nextTick(() => {
      if (!window.document) {
        return;
      }
      if (window.document.readyState === "complete") {
        const ev = window.document.createEvent("HTMLEvents");
        ev.initEvent("load", false, false);
        window.dispatchEvent(ev);
      } else {
        window.document.addEventListener("load", () => {
          const ev = window.document.createEvent("HTMLEvents");
          ev.initEvent("load", false, false);
          window.dispatchEvent(ev);
        });
      }
    });
  }
  inherits(EventTarget.interface, Window, EventTarget.interface.prototype);
  function matchesDontThrow(el, selector) {
    try {
      return el.matches(selector);
    } catch (e) {
      return false;
    }
  }
  function startTimer(window, startFn, stopFn, timerId, callback, ms, args) {
    if (typeof callback !== "function") {
      const code = String(callback);
      callback = window._globalProxy.eval.bind(window, code + `\n//# sourceURL=${window.location.href}`);
    }
    const oldCallback = callback;
    callback = () => {
      try {
        oldCallback.apply(window._globalProxy, args);
      } catch (e) {
        reportException(window, e, window.location.href);
      }
    };
    const res = startFn(callback, ms);
    window.__timers[timerId] = [res, stopFn];
    return timerId;
  }
  function stopTimer(window, id) {
    const timer = window.__timers[id];
    if (timer) {
      timer[1].call(window, timer[0]);
      delete window.__timers[id];
    }
  }
  function stopAllTimers(window) {
    Object.keys(window.__timers).forEach((key) => {
      const timer = window.__timers[key];
      timer[1].call(window, timer[0]);
    });
    window.__timers = Object.create(null);
  }
})(require('process'));