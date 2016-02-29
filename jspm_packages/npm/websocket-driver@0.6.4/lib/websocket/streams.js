/* */ 
(function(process) {
  'use strict';
  var Stream = require('stream').Stream,
      util = require('util');
  var IO = function(driver) {
    this.readable = this.writable = true;
    this._paused = false;
    this._driver = driver;
  };
  util.inherits(IO, Stream);
  IO.prototype.pause = function() {
    this._paused = true;
    this._driver.messages._paused = true;
  };
  IO.prototype.resume = function() {
    this._paused = false;
    this.emit('drain');
    var messages = this._driver.messages;
    messages._paused = false;
    messages.emit('drain');
  };
  IO.prototype.write = function(chunk) {
    if (!this.writable)
      return false;
    this._driver.parse(chunk);
    return !this._paused;
  };
  IO.prototype.end = function(chunk) {
    if (!this.writable)
      return;
    if (chunk !== undefined)
      this.write(chunk);
    this.writable = false;
    var messages = this._driver.messages;
    if (messages.readable) {
      messages.readable = messages.writable = false;
      messages.emit('end');
    }
  };
  IO.prototype.destroy = function() {
    this.end();
  };
  var Messages = function(driver) {
    this.readable = this.writable = true;
    this._paused = false;
    this._driver = driver;
  };
  util.inherits(Messages, Stream);
  Messages.prototype.pause = function() {
    this._driver.io._paused = true;
  };
  Messages.prototype.resume = function() {
    this._driver.io._paused = false;
    this._driver.io.emit('drain');
  };
  Messages.prototype.write = function(message) {
    if (!this.writable)
      return false;
    if (typeof message === 'string')
      this._driver.text(message);
    else
      this._driver.binary(message);
    return !this._paused;
  };
  Messages.prototype.end = function(message) {
    if (message !== undefined)
      this.write(message);
  };
  Messages.prototype.destroy = function() {};
  exports.IO = IO;
  exports.Messages = Messages;
})(require('process'));
