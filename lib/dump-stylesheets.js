/** ===== Functions to dump style sheets, rules & properties  ==================================================== */

function showStyleSheets() {
  var styleSheets = document.styleSheets;
  console.log("There are " + styleSheets.length + " style sheets");
  for (var i=0; i<styleSheets.length; i++) {
    var styleSheet = styleSheets[i];
    console.log("\n SHEET " + i + ": href = " + styleSheet.href);
    showStyleSheet(styleSheet);
  }
}

function showStyleSheet(styleSheet) {
  if (styleSheet.href != null) {
    var hrefComponents = styleSheet.href.split("/");
    console.log(" href = " + hrefComponents.join(", "));
  }
  var rules = styleSheet.cssRules;
  console.log(" rules = " + rules);
  console.log(" there are " + rules.length + " rules");
  for (var i=0; i<rules.length && i < 30; i++) {
    showRule(rules[i]);
  }
}

function showRule(rule) {
  console.log(" RULE, type = " + rule.type);
  console.log("   text = " + rule.cssText);
  if (rule.type == 1) {
    showRuleStyle(rule);
  }
  console.log("");
}

function showRuleStyle(rule) {
  console.log(" selector = " + rule.selectorText);
  var style = rule.style;
  for (var i=0; i<style.length; i++) {
    var propertyName = style[i];
    var value = style.getPropertyValue(propertyName);
    console.log("  property " + propertyName + " = " + value);
  }
}
