/* */ 
"use strict";
const ElementImpl = require('./Element-impl').implementation;
const MouseEvent = require('../generated/MouseEvent');
class HTMLElementImpl extends ElementImpl {
  constructor(args, privateData) {
    super(args, privateData);
    this._tabIndex = 0;
    this._eventDefaults = Object.create(null);
    this._settingCssText = false;
    this._style = new this._core.CSSStyleDeclaration((newCssText) => {
      if (!this._settingCssText) {
        this._settingCssText = true;
        this.setAttribute("style", newCssText);
        this._settingCssText = false;
      }
    });
  }
  dispatchEvent(event) {
    const outcome = super.dispatchEvent(event);
    if (!event.defaultPrevented && event.target._eventDefaults[event.type] && typeof event.target._eventDefaults[event.type] === "function") {
      event.target._eventDefaults[event.type](event);
    }
    return outcome;
  }
  focus() {
    this._ownerDocument._lastFocusedElement = this;
  }
  blur() {
    this._ownerDocument._lastFocusedElement = null;
  }
  click() {
    if (this.disabled) {
      return false;
    }
    const event = MouseEvent.createImpl(["click", {
      bubbles: true,
      cancelable: true
    }], {});
    this.dispatchEvent(event);
  }
  get style() {
    return this._style;
  }
  set style(value) {
    this._style.cssText = value;
  }
  _attrModified(name, value, oldValue) {
    if (name === "style" && value !== oldValue && !this._settingCssText) {
      this._settingCssText = true;
      this._style.cssText = value;
      this._settingCssText = false;
    }
    super._attrModified.apply(this, arguments);
  }
  get tabIndex() {
    if (!this.hasAttribute("tabindex")) {
      return -1;
    }
    return parseInt(this.getAttribute("tabindex"));
  }
  set tabIndex(value) {
    this.setAttribute("tabIndex", String(value));
  }
}
module.exports = {implementation: HTMLElementImpl};
