function inspect(object) {
  return JSON.stringify(object);
}

var popupHtmlUrl = chrome.extension.getURL("style-adjuster-extension-popup.html");

var messageHandler = {
  openPopupWindow: function(request, sender, sendResponse) {
    console.log("openPopupWindow ...");
    if(sender && sender.tab) {
      var url = popupHtmlUrl + "?" + sender.tab.id;
      console.log("Opening popup window with URL " + url);
      chrome.windows.create({ url: url, type: "popup", 
                              top: 300, left: 300, width: 800, height: 600 });
      sendResponse({message: "Popup window created"});
    }
  }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("runtime message " + inspect(request));
  if (sender && sender.tab) {
    console.log(" sender.tab.id = " + sender.tab.id);
  }
  var handler = messageHandler[request.type];
  if (handler) {
    handler(request, sender, sendResponse);
  }
  return true;
});

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({ file: 'style-adjuster-common.js'}); 
  chrome.tabs.executeScript({ file: 'style-adjuster-stylesheets.js'}); 
  chrome.tabs.executeScript({ file: 'initialise-target-tab.js'}); 
});
