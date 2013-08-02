$(document).ready(function(){
  //showStyleSheets();
  var styleAdjusterModel = new StyleAdjusterModel(document.styleSheets);
  styleAdjusterModel.deselectStyleSheets(function (styleSheet) {
    var href = styleSheet.href;
    return href == null || href.indexOf("jquery") != -1;
  });
  var styleAdjusterView = new StyleAdjusterView($("body"), styleAdjusterModel);
  
  $("body").keydown(function(event, ui) {
    if (event.which == 123 && !event.shiftKey && event.altKey && event.ctrlKey) { // Ctrl-Alt-F12
      styleAdjusterView.toggle();
    }
  });
});
