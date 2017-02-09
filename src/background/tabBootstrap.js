'use strict';
chrome.runtime.onConnect.addListener(function(port){
  port.onMessage.addListener(function(page){
    if(page.contentType === 'application/xml') return;
    chrome.tabs.executeScript(port.sender.tab.id,{file:'/vendors/jquery-3.1.1.min.js'});
    chrome.tabs.executeScript(port.sender.tab.id,{file:'/vendors/lz-string.min.js'});
    chrome.tabs.executeScript(port.sender.tab.id,{file:'/content_scripts/log.js'});
    chrome.tabs.executeScript(port.sender.tab.id,{file:'/content_scripts/storage.js'});
    chrome.tabs.executeScript(port.sender.tab.id,{file:'/content_scripts/main.js'});
  });
});
