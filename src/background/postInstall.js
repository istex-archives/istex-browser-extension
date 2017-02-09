'use strict';
function handleInstalled (details) {
  console.log(details.reason);

  var currentTab   = null;
  var currentTabId = -1;

  chrome.tabs.query({currentWindow: true, active: true}, function(tab) {
    currentTab   = tab[0];
    currentTabId = currentTab.id;
    //console.log(currentTabId);
    setTimeout(function() { chrome.tabs.update(currentTabId, {selected: true}); }, 400);
  });

  chrome.tabs.create({
                       //url: "https://scholar.google.fr/scholar_setprefs?sciifh=1&inststart=0&num=10&scis=no&scisf=4&instq=istex&inst=3094930661629783031&context=istex&save=#2"
                       url: "https://scholar.google.fr/scholar_setprefs?instq=istex&inst=3094930661629783031&ctxt=istex&save=#2"
                     });

  // write Scopus cookie for using ISTEX OpenUrl
}

chrome.runtime.onInstalled.addListener(handleInstalled);

chrome.runtime.onMessage.addListener(
  	function(request, sender) {
  		//console.log(sender.tab ?
        //        "from a content script:" + sender.tab.url:
        //        "from the extension");
  		if (request.text === 'done') {
      		// close the sender tab
      		chrome.tabs.remove(sender.tab.id);
    	}
	});



