var self = require("sdk/self");
var pageMod = require("sdk/page-mod");
var tabs = require("sdk/tabs");
require("sdk/preferences/service").set('extensions.sdk.console.logLevel', 'all');

// this will apply the script content-script.js in every web pages
pageMod.PageMod({
  include: "*",
  contentStyleFile: "./main.css",
  contentScriptFile: "./content-script.js"
});

// the addon button (for citation service) - active when an ISTEX PDF is displayed
var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");

var button = ToggleButton({
  id: "my-button",
  label: "my button",
  icon: {
    "16": "./icons/icon-grey-16.png",
    "32": "./icons/icon-grey-32.png",
    "96": "./icons/icon-grey-96.png"
  },
  disabled: true,
  onChange: handleChange
});

// panel displaying citation information
var panel = panels.Panel({
  contentURL: "./panel.html",
  width : 400,
  height : 300,
  onHide: handleHide,
  contextMenu : true
});

function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button,
      width : 500,
  	  height : 200,
    });
  }
}

function handleHide() {
  button.state('window', {checked: false});
}

// Listen for tab openings.
tabs.on('open', function onOpen(tab) {
  onNewTab(tab);
});

// Listen for tab content loads.
tabs.on('ready', function(tab) {
  onNewTab(tab);
});

function onNewTab(tab) {
  // Modify the state of the button only for the new tab
  var url = tab.url;
  if ( url && (url.indexOf("api.istex.fr/document/") != -1) &&
  		(url.indexOf("/pdf") != -1) ) {
  	button.state(tab, {"disabled" : false, "icon": { "16": "./icons/icon-16.png", "32": "./icons/icon-32.png", "96": "./icons/icon-96.png"} });
    panel.port.emit("url", url); 
  }
  else
  	button.state(tab, {"disabled" : true});
}
