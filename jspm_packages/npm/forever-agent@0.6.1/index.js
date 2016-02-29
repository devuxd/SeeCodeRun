/* */ 
module.exports = ForeverAgent;
ForeverAgent.SSL = ForeverAgentSSL;
var util = require('util'),
    Agent = require('http').Agent,
    net = require('net'),
    tls = require('tls'),
    AgentSSL = require('https').Agent;
function getConnectionName(host, port) {
  var name = '';
  if (typeof host === 'string') {
    name = host + ':' + port;
  } else {
    name = host.host + ':' + host.port + ':' + (host.localAddress ? (host.localAddress + ':') : ':');
  }
  return name;
}
function ForeverAgent(options) {
  var self = this;
  self.options = options || {};
  self.requests = {};
  self.sockets = {};
  self.freeSockets = {};
  self.maxSockets = self.options.maxSockets || Agent.defaultMaxSockets;
  self.minSockets = self.options.minSockets || ForeverAgent.defaultMinSockets;
  self.on('free', function(socket, host, port) {
    var name = getConnectionName(host, port);
    if (self.requests[name] && self.requests[name].length) {
      self.requests[name].shift().onSocket(socket);
    } else if (self.sockets[name].length < self.minSockets) {
      if (!self.freeSockets[name])
        self.freeSockets[name] = [];
      self.freeSockets[name].push(socket);
      var onIdleError = function() {
        socket.destroy();
      };
      socket._onIdleError = onIdleError;
      socket.on('error', onIdleError);
    } else {
      socket.destroy();
    }
  });
}
util.inherits(ForeverAgent, Agent);
ForeverAgent.defaultMinSockets = 5;
ForeverAgent.prototype.createConnection = net.createConnection;
ForeverAgent.prototype.addRequestNoreuse = Agent.prototype.addRequest;
ForeverAgent.prototype.addRequest = function(req, host, port) {
  var name = getConnectionName(host, port);
  if (typeof host !== 'string') {
    var options = host;
    port = options.port;
    host = options.host;
  }
  if (this.freeSockets[name] && this.freeSockets[name].length > 0 && !req.useChunkedEncodingByDefault) {
    var idleSocket = this.freeSockets[name].pop();
    idleSocket.removeListener('error', idleSocket._onIdleError);
    delete idleSocket._onIdleError;
    req._reusedSocket = true;
    req.onSocket(idleSocket);
  } else {
    this.addRequestNoreuse(req, host, port);
  }
};
ForeverAgent.prototype.removeSocket = function(s, name, host, port) {
  if (this.sockets[name]) {
    var index = this.sockets[name].indexOf(s);
    if (index !== -1) {
      this.sockets[name].splice(index, 1);
    }
  } else if (this.sockets[name] && this.sockets[name].length === 0) {
    delete this.sockets[name];
    delete this.requests[name];
  }
  if (this.freeSockets[name]) {
    var index = this.freeSockets[name].indexOf(s);
    if (index !== -1) {
      this.freeSockets[name].splice(index, 1);
      if (this.freeSockets[name].length === 0) {
        delete this.freeSockets[name];
      }
    }
  }
  if (this.requests[name] && this.requests[name].length) {
    this.createSocket(name, host, port).emit('free');
  }
};
function ForeverAgentSSL(options) {
  ForeverAgent.call(this, options);
}
util.inherits(ForeverAgentSSL, ForeverAgent);
ForeverAgentSSL.prototype.createConnection = createConnectionSSL;
ForeverAgentSSL.prototype.addRequestNoreuse = AgentSSL.prototype.addRequest;
function createConnectionSSL(port, host, options) {
  if (typeof port === 'object') {
    options = port;
  } else if (typeof host === 'object') {
    options = host;
  } else if (typeof options === 'object') {
    options = options;
  } else {
    options = {};
  }
  if (typeof port === 'number') {
    options.port = port;
  }
  if (typeof host === 'string') {
    options.host = host;
  }
  return tls.connect(options);
}
