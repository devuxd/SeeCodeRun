//Note: This file is provided as an aid to help you get up and running with
//Electron for desktop apps. See the readme file for more information.
/* eslint-disable strict, no-var, no-console */

'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var mainWindow = null;

require('crash-reporter').start();

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.setTitle(app.getName());
  });
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
