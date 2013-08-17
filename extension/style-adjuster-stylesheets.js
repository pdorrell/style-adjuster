window.STYLE_ADJUSTER = window.STYLE_ADJUSTER || {};

console.log("start of style-adjuster-stylesheets.js STYLE_ADJUSTER = " + STYLE_ADJUSTER);

(function(lib) {

  // imports from common
  var InvalidPropertyValueError = lib.InvalidPropertyValueError;
  var parseSingleCssPropertyRule = lib.parseSingleCssPropertyRule;
  var inspect = lib.inspect;
  var trim = lib.trim;

  /** ===== Utility functions ====================================================== */
  
  function alertUnexpectedError(message, error) {
    alert("Style Adjuster unexpected error: " + message + "\n(see developer console for further details)");
    if(error) {
      throw error;
    }
    else {
      throw new Error(message);
    }
  }
    
  /** ===== Dom StyleSheets wrapper ====================================================== */

  function StyleSheets(domStyleSheets) {
    this.domStyleSheets = domStyleSheets;
    this.styleSheets = [];
    this.styleSheetObjects = [];
    for (var i=0; i<domStyleSheets.length; i++) {
      var styleSheet = new StyleSheet(this, i, domStyleSheets[i]);
      this.styleSheets.push(styleSheet);
      var styleSheetObject = styleSheet.getStyleSheetObject();
      this.styleSheetObjects.push(styleSheetObject);
    }
  }
  
  StyleSheets.prototype = {
  public: {getStyleSheetObjects: true, updatePropertyValue: true}, 
    
    /** "public" method */
    getStyleSheetObjects: function(request, response) {
      response(this.styleSheetObjects);
    }, 
    
    /** "public" method */
    updatePropertyValue: function(request, response) {
      try {
        this.styleSheets[request.index].updatePropertyValue(request.ruleIndex, request.name, 
                                                            request.value, request.expectedSavedValue);
      }
      catch(error) {
        console.log("Unexpected error from StyleSheets.updatePropertyValue:");
        console.log(error.stack);
      }
    }, 
    
    toString: function() {
      return "[StyleSheets]";
    }
  };

  /** "tab-side" class  */
  function StyleSheet(styleSheets, index, domStyleSheet) {
    this.styleSheets = styleSheets;
    this.index = index;
    this.domStyleSheet = domStyleSheet;
    this.ruleObjects = this.getRuleObjects();
    this.ruleSavers = this.ruleObjects == null ? null : new RuleSavers(domStyleSheet, this.ruleObjects);
  }
  
  StyleSheet.prototype = {
    getRuleObject: function(index, domIndex, cssRule) {
      return {index: index, domIndex: domIndex, type: cssRule.type, 
              selectorText: cssRule.selectorText, cssText: cssRule.cssText};
    }, 
    
    getRuleObjects: function() {
      var cssRules = this.domStyleSheet.cssRules;
      if (cssRules == null) {
        return null;
      }
      else {
        var rules = [];
        for (var i=0; i<cssRules.length; i++) {
          var cssRule = cssRules[i];
          var index = rules.length;
          var domIndex = i;
          if (cssRule.type == 1) {
            rules.push(this.getRuleObject(index, domIndex, cssRule));
          }
        }
        return rules;
      }
    }, 
    
    getStyleSheetObject: function() {
      return {index: this.index, href: this.domStyleSheet.href, rules: this.ruleObjects};
    }, 
    
    insertRule: function (cssText, ruleIndex, domRuleIndex) {
      this.domStyleSheet.insertRule(cssText, ruleIndex);
      var newRule = this.getRuleObject(ruleIndex, domRuleIndex, this.domStyleSheet.cssRules[domRuleIndex]);
      this.ruleObjects.splice(ruleIndex, 0, newRule);
      return newRule;
    }, 

    deleteRule: function(ruleIndex, domRuleIndex) {
      this.domStyleSheet.deleteRule(domRuleIndex);
      this.ruleObjects.splice(ruleIndex, 1);
    }, 
    
    updatePropertyValue: function(ruleIndex, name, value, expectedSavedValue) {
      this.ruleSavers.updatePropertyValue(ruleIndex, name, value, expectedSavedValue);
      //this.dumpStyleSheet();
      //this.ruleSavers.dump();
    }, 
    dumpStyleSheet: function() {
      var cssRules = this.domStyleSheet.cssRules
      console.log("DUMPSTYLESHEET, cssRules.length = " + cssRules.length);
      for (var i=0; i<cssRules.length; i++) {
        console.log("   " + cssRules[i].cssText);
      }
      console.log("");
    }
  }
  
  function RuleSavers(domStyleSheet, ruleObjects) {
    this.domStyleSheet = domStyleSheet;
    this.savers = [];
    for (var i=0; i<ruleObjects.length; i++) {
      var ruleObject = ruleObjects[i];
      var saver = new RuleSaver(this, domStyleSheet, i, ruleObject.domIndex);
      this.savers.push(saver);
    }
  }
  
  RuleSavers.prototype = {
    updatePropertyValue: function(ruleIndex, name, value, expectedSavedValue) {
      this.savers[ruleIndex].updatePropertyValue(name, value, expectedSavedValue);
    }, 
    pushFollowingRulesAlong: function(ruleIndex, offset) {
      for (var i=ruleIndex+1; i<this.savers.length; i++) {
        var saver = this.savers[i];
        saver.domRuleIndex = saver.domRuleIndex + offset;
      }
    }, 
    dump: function() {
      console.log("RULE SAVERS:");
      for (var i=0; i<this.savers.length; i++) {
        this.savers[i].dump();
      }
      console.log("");
    }
  };
  
  function RuleSaver(ruleSavers, domStyleSheet, ruleIndex, domRuleIndex) {
    this.ruleSavers = ruleSavers;
    this.domStyleSheet = domStyleSheet;
    this.ruleIndex = ruleIndex;
    this.domRuleIndex = domRuleIndex;
    this.rule = domStyleSheet.cssRules[domRuleIndex];
    this.selectorText = this.rule.selectorText
    this.cssText = this.rule.cssText;
    this.propertyRuleOffsets = {}
    this.numPropertiesSaved = 0;
  }
  
  RuleSaver.prototype = {
    dump: function() {
      console.log(" SAVER(" +  this.ruleIndex + "): " + this.cssText);
      console.log("  domRuleIndex = " + this.domRuleIndex);
      console.log("  saved: " + this.numPropertiesSaved);
      console.log("  propertyRuleOffsets = " + inspect(this.propertyRuleOffsets));
    }, 
    logUpdateAttempt: function(name, value, expectedSavedValue, newCssText, savedCssText, savedValue) {
      console.log("Attempted update of rule " + this.ruleIndex + " in stylesheet " + this.domStyleSheet.href + ":");
      console.log("  " + name + ": " + inspect(value));
      console.log(" expected save value = " + inspect(expectedSavedValue));
      if (savedValue == null) {
        console.log("  (no actual saved value)");
      }
      else {
        console.log(" actual saved value = " + inspect(savedValue));
      }
      console.log("  intended updated rule CSS text = " + inspect(newCssText));
      if(savedCssText) {
        console.log("  actual saved rule CSS text = " + inspect(savedCssText));
      }
      console.log("");
    }, 
    
    updatePropertyValue: function(name, value, expectedSavedValue) {
      var propertyRuleOffset = this.propertyRuleOffsets[name];
      var createNewRule = !propertyRuleOffset;
      if (createNewRule) {
        this.numPropertiesSaved++;
        propertyRuleOffset = this.numPropertiesSaved;
        this.propertyRuleOffsets[name] = propertyRuleOffset;
      }
      var domNewRuleIndex = this.domRuleIndex + propertyRuleOffset;
      var newCssText = this.selectorText + " { " + name + ": " + value + "; }";
      this.domStyleSheet.insertRule(newCssText, domNewRuleIndex);
      var newRule = this.domStyleSheet.cssRules[domNewRuleIndex];
      var savedCssText = newRule.cssText;
      if (createNewRule) {
        this.ruleSavers.pushFollowingRulesAlong(this.ruleIndex, 1);
      }
      else {
        this.domStyleSheet.deleteRule(domNewRuleIndex+1);
      }
      try {
        var savedCss = parseSingleCssPropertyRule(savedCssText);
        if (savedCss == null) {
          this.logUpdateAttempt(name, value, expectedSavedValue, newCssText, savedCssText, null);
          alertUnexpectedError("Property " + name + " value " + inspect(value) + 
                               " rejected by the browser (expected " + inspect(expectedSavedValue) + ")");
        }
        if (savedCss.value != expectedSavedValue) {
          this.logUpdateAttempt(name, value, expectedSavedValue, newCssText, savedCssText, savedCss.value);
          alertUnexpectedError("Property " + name + " value " + inspect(value) + ", saved as " + 
                               inspect(savedCss.value) + ", but expected " + inspect(expectedSavedValue));
        }
      }
      catch(error) {
        if(error instanceof InvalidPropertyValueError) {
          this.logUpdateAttempt(name, value, expectedSavedValue, newCssText, savedCssText);
          alertUnexpectedError(error.message);
        }
      }
    }
  };
  
  // export publicly accessible classes & functions
  lib.StyleSheets = StyleSheets;
  
})(window.STYLE_ADJUSTER);

console.log("end of style-adjuster-stylesheets.js STYLE_ADJUSTER = " + STYLE_ADJUSTER);
