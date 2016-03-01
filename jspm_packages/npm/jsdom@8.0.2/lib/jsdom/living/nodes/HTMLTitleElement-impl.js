/* */ 
"use strict";
const HTMLElementImpl = require('./HTMLElement-impl').implementation;
class HTMLTitleElementImpl extends HTMLElementImpl {
  get text() {
    return this.innerHTML;
  }
  set text(s) {
    this.textContent = s;
  }
}
module.exports = {implementation: HTMLTitleElementImpl};
