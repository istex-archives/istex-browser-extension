var browser = browser;
function log (message) {
  if (browser && browser.extension.lastError) {
    console.error(browser.extension.lastError);
  }

  message && console.dir(message);
}

function error (error) {
  console.error(error);
  throw error;
}


(function() {
  'use strict';

  chrome
    .tabs
    .query({active: true, currentWindow: true}, function(tabs) {

      try {
        chrome
          .tabs
          .executeScript({file: "/content_scripts/CSVExhport.js"}, log);

        chrome
          .tabs
          .executeScript({file: "/content_scripts/istex.js"}, log);

        chrome.runtime.onConnect.addListener(function(port) {
          var click = function click () {
            port.postMessage({"startRequest": {}});
          };
          $('button').on("click", click);
        });

      } catch (e) {
        error(e);
      }
    });
})();

