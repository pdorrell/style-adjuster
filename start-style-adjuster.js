function startStyleAdjuster() {

  STYLE_ADJUSTER.options.helpHtmlUrl = chrome.extension.getURL("help.html");
  STYLE_ADJUSTER.options.jqueryUiCssUrl = chrome.extension.getURL("base/jquery-ui.extension.css");
  STYLE_ADJUSTER.options.styleAdjusterCssUrl = chrome.extension.getURL("style-adjuster.css");

  // Create the Style Adjuster model from the document's style sheets
  var styleSheets = new STYLE_ADJUSTER.StyleSheets(document.styleSheets);
  var styleAdjusterModel = new STYLE_ADJUSTER.StyleAdjusterModel(styleSheets);
  
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
}

startStyleAdjuster();

