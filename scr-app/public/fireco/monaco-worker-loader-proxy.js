const latest = '0.11.1';
self.MonacoEnvironment = {
  baseUrl: 'https://cdn.jsdelivr.net/npm/monaco-editor@'+latest+'/min/',
};
importScripts('https://cdn.jsdelivr.net/npm/monaco-editor@'+latest+'/min/vs/base/worker/workerMain.js');
