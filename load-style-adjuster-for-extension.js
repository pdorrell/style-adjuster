// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  console.log('Starting Style Adjuster');
  chrome.tabs.insertCSS({ file: 'js/jquery-ui-1.10.3/themes/base/jquery-ui.extension.css'}); 
  chrome.tabs.insertCSS({ file: 'lib/style-adjuster.css'}); 
  chrome.tabs.executeScript({ file: 'js/jquery-1.10.2.js'}); 
  chrome.tabs.executeScript({ file: 'js/jquery-ui-1.10.3/jquery-ui.js'}); 
  chrome.tabs.executeScript({ file: 'lib/style-adjuster.js'}); 
  chrome.tabs.executeScript({ code: 'startStyleAdjuster();'}); 
});

function startStyleAdjuster() {

  // Create the Style Adjuster model from the document's style sheets
  var styleAdjusterModel = new STYLE_ADJUSTER.StyleAdjusterModel(document.styleSheets);
  
  // initially deselect style sheets from jquery UI styles
  styleAdjusterModel.deselectStyleSheets(function (styleSheet) {
    var href = styleSheet.href;
    return href == null || href.indexOf("jquery") != -1;
  });
  
  // Create the Style Adjuster dialog (and display it)
  var styleAdjusterView = new STYLE_ADJUSTER.StyleAdjusterView($("body"), styleAdjusterModel);
  
  // Set Ctrl-Alt-F12 to hide/show the dialog
  $("body").keydown(function(event, ui) {
    if (event.which == 123 && !event.shiftKey && event.altKey && event.ctrlKey) { // Ctrl-Alt-F12
      styleAdjusterView.toggle();
    }
  });
}();

