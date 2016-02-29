/* */ 
'use strict';
var schemas = {
  cache: require('./cache.json!systemjs-json'),
  cacheEntry: require('./cacheEntry.json!systemjs-json'),
  content: require('./content.json!systemjs-json'),
  cookie: require('./cookie.json!systemjs-json'),
  creator: require('./creator.json!systemjs-json'),
  entry: require('./entry.json!systemjs-json'),
  har: require('./har.json!systemjs-json'),
  log: require('./log.json!systemjs-json'),
  page: require('./page.json!systemjs-json'),
  pageTimings: require('./pageTimings.json!systemjs-json'),
  postData: require('./postData.json!systemjs-json'),
  record: require('./record.json!systemjs-json'),
  request: require('./request.json!systemjs-json'),
  response: require('./response.json!systemjs-json'),
  timings: require('./timings.json!systemjs-json')
};
schemas.cache.properties.beforeRequest = schemas.cacheEntry;
schemas.cache.properties.afterRequest = schemas.cacheEntry;
schemas.page.properties.pageTimings = schemas.pageTimings;
schemas.request.properties.cookies.items = schemas.cookie;
schemas.request.properties.headers.items = schemas.record;
schemas.request.properties.queryString.items = schemas.record;
schemas.request.properties.postData = schemas.postData;
schemas.response.properties.cookies.items = schemas.cookie;
schemas.response.properties.headers.items = schemas.record;
schemas.response.properties.content = schemas.content;
schemas.entry.properties.request = schemas.request;
schemas.entry.properties.response = schemas.response;
schemas.entry.properties.cache = schemas.cache;
schemas.entry.properties.timings = schemas.timings;
schemas.log.properties.creator = schemas.creator;
schemas.log.properties.browser = schemas.creator;
schemas.log.properties.pages.items = schemas.page;
schemas.log.properties.entries.items = schemas.entry;
schemas.har.properties.log = schemas.log;
module.exports = schemas;
