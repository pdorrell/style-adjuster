// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  console.log('Starting Style Adjuster');
  function insertCssFile(file) {
    console.log("Inserting CSS " + file + " ...");
    chrome.tabs.insertCSS({ file: file});
  }
    
  insertCssFile('base/jquery-ui.extension.css');
  insertCssFile('style-adjuster.css');
  chrome.tabs.executeScript({ file: 'jquery-1.10.2.js'}); 
  chrome.tabs.executeScript({ file: 'jquery-ui.js'}); 
  chrome.tabs.executeScript({ file: 'style-adjuster.js'}); 
  chrome.tabs.executeScript({ file: 'start-style-adjuster.js'}); 
});

