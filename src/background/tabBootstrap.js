'use strict';
var whiteList         = [
      'scholar.google.*',
      '*.wikipedia.org',
      'scholar.*.fr',
      '*' // Until we get better whitelist
    ],
    whiteListPatterns = whiteList.map(compileUrlPattern)
  ;


chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(page) {
    if (page.contentType === 'application/xml'
        || !isWhiteListed(port.sender.url)
    ) return;

    chrome.tabs.executeScript(port.sender.tab.id, {file: '/vendors/jquery-3.2.1.js'});
    chrome.tabs.executeScript(port.sender.tab.id, {file: '/vendors/lz-string.js'});
    chrome.tabs.executeScript(port.sender.tab.id, {file: '/content_scripts/log.js'});
    chrome.tabs.executeScript(port.sender.tab.id, {file: '/content_scripts/storage.js'});
    chrome.tabs.executeScript(port.sender.tab.id, {file: '/content_scripts/main.js'});
  });
});

function isWhiteListed (url) {
  for (var i = 0; i < whiteListPatterns.length; ++i) {
    if (url.match(whiteListPatterns[i])) {
      return true;
    }
  }
  return false;
}

function escapeStringForRegex (str) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function compileUrlPattern (url) {
  return new RegExp(
    escapeStringForRegex(url).replace('\\*', '.*'),
    'i'
  );
}

