'use strict';

function handleInstalled(details) {
  console.log(details.reason);

  var currentTab = null;
  var currentTabId = -1;

  chrome.tabs.query({ currentWindow: true, active: true }, function(tab) {
    currentTab = tab[0];
    currentTabId = currentTab.id;
    //console.log(currentTabId);
    setTimeout(function() { chrome.tabs.update(currentTabId, { selected: true }); }, 400);
  });

  chrome.runtime.openOptionsPage();
}

chrome.runtime.onInstalled.addListener(handleInstalled);