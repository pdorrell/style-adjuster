$(document).ready(function(){
  
  function load(script){
    jQuery.ajax({async:false, type:'GET',
                 url:script, data:null,
                 dataType:'script', 
                 success: function() { 
                   console.log("Success loading " + script); 
                 },
                 error: function(jqXHR, textStatus, errorThrown) {
                   console.log("Error " + textStatus + ", " + errorThrown);
                 }
                });
  }
  
  load ("lib/css-colors.js");
  load ("lib/style-adjuster.js");
  
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
