'use strict';

function handleInstalled(details) {
  console.log(details.reason);
  chrome.tabs.create({
    url: chrome.runtime.getURL('/options/options.html')
  });
}

chrome.runtime.onInstalled.addListener(handleInstalled);