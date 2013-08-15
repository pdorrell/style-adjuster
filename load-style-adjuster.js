function loadStyleAdjuster() {

  // Create the Style Adjuster model from the document's style sheets
  var styleSheets = new STYLE_ADJUSTER.StyleSheets(document.styleSheets);
  var styleAdjusterModel = new STYLE_ADJUSTER.StyleAdjusterModel(styleSheets);
  
  styleAdjusterModel.initialise(function() {
    // Create the Style Adjuster dialog (and display it)
    var styleAdjusterView = new STYLE_ADJUSTER.StyleAdjusterView(null, styleAdjusterModel);
  });
};
