function inspect(object) {
  return JSON.stringify(object);
}

var styleSheets = null;

function StyleSheetsProxy(tabId) {
  this.tabId = tabId;
}

StyleSheetsProxy.prototype = {
  getStyleSheetObjects: function(request, handleResult) {
    request.$method = "getStyleSheetObjects";
    chrome.tabs.sendMessage(this.tabId, request, 
                            function(result) { handleResult(result); });
  }, 
  updatePropertyValue: function(request, handleResult) {
    request.$method = "updatePropertyValue";
    chrome.tabs.sendMessage(this.tabId, request, 
                            function(result) { handleResult(result); });
  }
};

function initialiseFromStyleSheetsObject(styleSheets) {
  var styleAdjusterModel = new STYLE_ADJUSTER.StyleAdjusterModel(styleSheets);
  styleAdjusterModel.initialise(function() {
    // Deselect stylesheets with no URL (typically come from browser extensions)
    styleAdjusterModel.deselectStyleSheets(function(styleSheet)  { return styleSheet.href == null; });
    var styleAdjusterView = new STYLE_ADJUSTER.StyleAdjusterView(null, styleAdjusterModel);
  });
}  

function initialiseStyleAdjusterFromOpener() {
  console.log("initialiseStyleAdjusterFromOpener, window.opener = " + window.opener);
  initialiseFromStyleSheetsObject(window.opener.styleSheets);
}

function initialiseStyleAdjusterFromProxy(urlQueryString) {
  console.log("initialiseStyleAdjusterFromProxy ...");
  var targetTabId = parseInt(urlQueryString.substring(1));
  console.log(" targetTabId = " + inspect(targetTabId));
  initialiseFromStyleSheetsObject(new StyleSheetsProxy(targetTabId));
}

function initialise() {
  var urlQueryString = window.location.search;
  console.log("initialise, urlQueryString = " + inspect(urlQueryString));
  if (urlQueryString == "") {
    initialiseStyleAdjusterFromOpener();
  }
  else {
    initialiseStyleAdjusterFromProxy(urlQueryString);
  }
}
  
$(document).ready(function(){
  console.log("Document ready ...");
  initialise();
});

