function startStyleAdjuster() {

  STYLE_ADJUSTER.options.helpHtmlUrl = chrome.extension.getURL("help.html");
  STYLE_ADJUSTER.options.jqueryUiCssUrl = chrome.extension.getURL("base/jquery-ui.extension.css");
  STYLE_ADJUSTER.options.styleAdjusterCssUrl = chrome.extension.getURL("style-adjuster.css");

  // Create the Style Adjuster model from the document's style sheets
  var styleSheets = new STYLE_ADJUSTER.StyleSheets(document.styleSheets);
  var styleAdjusterModel = new STYLE_ADJUSTER.StyleAdjusterModel(styleSheets);
  
  styleAdjusterModel.initialise(function () {
    
    // initially deselect style sheets from jquery UI styles
    styleAdjusterModel.deselectStyleSheets(function (styleSheet) {
      var href = styleSheet.href;
      return href == null || href.indexOf("jquery") != -1;
    });
    
    // Create the Style Adjuster dialog (and display it)
    var styleAdjusterView = new STYLE_ADJUSTER.StyleAdjusterView($("body"), styleAdjusterModel);
  });
}

startStyleAdjuster();

