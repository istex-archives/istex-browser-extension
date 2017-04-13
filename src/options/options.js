'use strict';

// if mode is not 0, we are in installation and mode gives the number of tabs opened with plugin install, 
// otherwise mode is 0 and nothing shall be closed automatically to avoid an ISTEX totalitarian behaviour
var mode = 0;
var optionsTabId;
var istexLibraryId = "2733342842941555958"; //2733342842941555958;

document.addEventListener('click', (e) => {

  if (e.target.classList.contains('accept')) {
    console.log('Accepter');

    mode = 2;

    chrome.tabs.query({ currentWindow: true, active: true }, function(optionTab) {
      optionsTabId = optionTab[0].id;

      $.ajax({
        url: "https://scholar.google.fr/scholar_setprefs?instq=istex",
        dataType: 'html'
      }).done(function(data) {
        var parser = new DOMParser(),
          doc = parser.parseFromString(data, "text/html");
        istexLibraryId = doc.getElementsByName('inst')[0].value;
        console.log(istexLibraryId);

        chrome.tabs.create({
          //url: "https://scholar.google.fr/scholar_setprefs?sciifh=1&inststart=0&num=10&scis=no&scisf=4&instq=istex&inst=3094930661629783031&context=istex&save=#2"
          url: "https://scholar.google.fr/scholar_setprefs?instq=istex&inst=" + istexLibraryId + "&ctxt=istex&save=#2"
        });

        chrome.tabs.create({
          //url: "https://scholar.google.fr/scholar_setprefs?sciifh=1&inststart=0&num=10&scis=no&scisf=4&instq=istex&inst=3094930661629783031&context=istex&save=#2"
          url: "https://scholar.google.com/scholar_setprefs?instq=istex&inst=" + istexLibraryId + "&ctxt=istex&save=#2"
        });


      });
    });
  };

  if (e.target.classList.contains('skip')) {
    console.log('Passer');
    chrome.tabs.query({ currentWindow: true, active: true }, function(tab) {
      chrome.tabs.remove(tab[0].id);
    });
  };
});

var filter = {
  url: [{
    hostContains: "scholar.google" //,
      // queryEquals: "hl=fr&as_sdt=0&inst=" + istexLibraryId
  }]
};

var scholarTabsIds = [];

var listener = function(details) {
  // First time, we save
  if (scholarTabsIds.indexOf(details.tabId) === -1) {
    console.log('Complete ' + details.tabId);
    chrome.tabs.executeScript(details.tabId, {
      code: 'document.getElementsByName("save")[0].click();'
    }, function(result) {
      console.log('Script OK');
      scholarTabsIds.push(details.tabId);
    });
  } else {
    // Second time, we close
    console.log('AfterSave ' + details.tabId);
    chrome.tabs.remove(details.tabId);
    mode--;
    if (mode === 0) {
      chrome.webNavigation.onCompleted.removeListener(listener);
      chrome.tabs.remove(optionsTabId);
    }
  }
};

chrome.webNavigation.onCompleted.addListener(listener, filter);