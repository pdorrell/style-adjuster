window.STYLE_ADJUSTER = window.STYLE_ADJUSTER || {};

(function(lib) {

  function InvalidPropertyValueError(name, value, reason) {
    this.name = name;
    this.value = value;
    this.reason = reason;
    this.message = "Invalid value for CSS property " + name + ": \"" + value + "\"" + 
      (reason ? " (" + reason + ")" : "");
  }
  
  function parseSingleCssPropertyRule(cssText) {
    var openBracePos = cssText.indexOf("{");
    var closeBracePos = cssText.lastIndexOf("}");
    if (openBracePos == -1 || closeBracePos == -1) {
      throw new InvalidPropertyValueError(property, value, "Bad CSS text (no braces): " + inspect(newRule.cssText));
    }
    var selector = trim(cssText.substring(0, openBracePos));
    var propertyText = cssText.substring(openBracePos+1, closeBracePos);
    var colonPos = propertyText.indexOf(":");
    if (colonPos == -1) {
      return null;
    }
    var semicolonPos = propertyText.lastIndexOf(";");
    if (semicolonPos == -1) {
      throw new InvalidPropertyValueError(property, value, "Bad CSS text (no semi-colon): " + 
                                          inspect(newRule.cssText));
    }
    var property = trim(propertyText.substring(0, colonPos));
    var value = trim(propertyText.substring(colonPos+1, semicolonPos));
    return {selector: selector, property: property, value: value};
  }
  
  function inspect(object) {
    return JSON.stringify(object);
  }

  function trim (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }

  lib.InvalidPropertyValueError = InvalidPropertyValueError;
  lib.parseSingleCssPropertyRule = parseSingleCssPropertyRule;
  lib.inspect = inspect;
  lib.trim = trim;
  
})(window.STYLE_ADJUSTER);
  