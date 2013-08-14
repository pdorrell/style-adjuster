function loadStyleAdjuster() {

  // Create the Style Adjuster model from the document's style sheets
  var styleAdjusterModel = new STYLE_ADJUSTER.StyleAdjusterModel(document.styleSheets);
  
  // Create the Style Adjuster dialog (and display it)
  var styleAdjusterView = new STYLE_ADJUSTER.StyleAdjusterView(null, styleAdjusterModel);
};
