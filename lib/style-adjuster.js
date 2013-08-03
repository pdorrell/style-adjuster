/** ===== Utility Functions & Classes ========================================================================= */

function trim (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

function selectDomElementContents(element) {
  if (window.getSelection && document.createRange) {
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (document.selection && document.body.createTextRange) {
    var textRange = document.body.createTextRange();
    textRange.moveToElementText(element);
    textRange.select();
  }
}

function Observable(value) {
  this.value = value;
  this.log = false
  this.description = "Observable";
  this.changeHandlers = [];
}

Observable.prototype = {
  set: function(value) {
    if(this.log)
      console.log("Observable " + this.description + ", set to " + value + " (existing value = " + this.value + ")");
    if (this.value != value) {
      this.value = value;
      this.hasChanged(value);
    }
  }, 

  hasChanged: function(value) {
    value = value || this.value;
    if(this.log)
      console.log(" " + this.description + " triggered change event on " + this.changeHandlers.length + " handlers");
    for (var i=0; i<this.changeHandlers.length; i++) {
      this.changeHandlers[i](value);
    }
  }, 

  get: function() {
    return this.value;
  }, 

  onChange: function(handler, subscriber) {
    handler.subscriber = subscriber;
    this.changeHandlers.push(handler);
  }, 

  disconnect: function(subscriber) {
    for (var i=this.changeHandlers.length-1; i>=0; i--) {
      if (this.changeHandlers[i].subscriber == subscriber) {
        this.changeHandlers.splice(i, 1);
      }
    }
  }, 

  nowAndOnChange: function(handler, subscriber) {
    handler(this.get());
    this.onChange(handler, subscriber);
  }
};

/** ===== Application Models ========================================================================= */

function StyleAdjusterModel(styleSheets) {
  this.styleSheets = styleSheets;
  this.styleSheetsList = [];
  for (var i=0; i<styleSheets.length; i++) {
    this.styleSheetsList.push(new StyleSheetModel(this, styleSheets[i]));
  }
  this.rulesFilterText = "";
  this.propertyBeingEdited = null;
  this.valueEditorModel = new ValueEditorModel();
}

StyleAdjusterModel.prototype = {
  deselectStyleSheets: function(selectorFunction) {
    for (var i=0; i<this.styleSheetsList.length; i++) {
      var styleSheetModel = this.styleSheetsList[i];
      if (selectorFunction(styleSheetModel.styleSheet)) {
        styleSheetModel.selected = false;
      }
    }
  }, 
  
  setExpandedOnAllVisibleRules: function(expanded) {
    for (var i=0; i<this.styleSheetsList.length; i++) {
      var styleSheetModel = this.styleSheetsList[i];
      styleSheetModel.setExpandedOnAllVisibleRules(expanded);
    }
  }, 
  
  getCssChangesText: function() {
    var changeTexts = [];
    for (var i=0; i<this.styleSheetsList.length; i++) {
      var styleSheetModel = this.styleSheetsList[i];
      if (styleSheetModel.selected) {
        var changeText = styleSheetModel.getCssChangesText();
        if (changeText != null) {
          changeTexts.push(changeText);
        }
      }
    }
    if (changeTexts.length == 0) {
      return "/** No changes made **/\n";
    }
    else {
      return changeTexts.join("");
    }
  }, 
  
  filterRulesOn: function(text) {
    this.rulesFilterText = text;
    this.filterRules();
  }, 
  
  setOnlyShowSelected: function(onlyShowSelected) {
    this.onlyShowSelected = onlyShowSelected;
    this.filterRules();
  }, 
  
  filterRules: function() {
    for (var i=0; i<this.styleSheetsList.length; i++) {
      var styleSheetModel = this.styleSheetsList[i];
      styleSheetModel.filterRules();
    }
  }, 
  
  findStyleSheetsToEdit: function() {
    this.styleSheetsToEdit = [];
    for (var i=0; i<this.styleSheetsList.length; i++) {
      var styleSheetModel = this.styleSheetsList[i];
      if(styleSheetModel.selected) {
        styleSheetModel.findRulesToEdit();
        if (styleSheetModel.rulesToEdit.length > 0) {
          this.styleSheetsToEdit.push(styleSheetModel);
        }
      }
    }
  }, 
  
  clearPropertyEditor: function() {
    if (this.propertyBeingEdited != null) {
      this.propertyBeingEdited.beingEdited.set(false);
    }
    this.propertyBeingEdited = null;
    this.valueEditorModel.propertyModel.set(null);
  }, 
  
  editProperty: function(propertyModel) {
    this.clearPropertyEditor();
    this.propertyBeingEdited = propertyModel;
    this.propertyBeingEdited.beingEdited.set(true);
    this.valueEditorModel.editProperty(propertyModel);
  }
};

function InvalidPropertyValueError(name, value) {
  this.name = name;
  this.value = value;
  this.message = "Invalid value for CSS property " + name + ": \"" + value + "\"";
}

function StyleSheetModel(styleAdjusterModel, styleSheet) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.styleSheet = styleSheet;
  this.selected = true;
  this.populateRules();
}

StyleSheetModel.prototype = {
  updatePropertyValue: function(ruleIndex, name, value, cssTextModel) {
    if (value.indexOf(";") != -1) {
      throw new InvalidPropertyValueError(name,  value); // treat any ";" as invalid, to avoid confusion when parsing
    }
    var newCssText = cssTextModel.cssTextForUpdated(name, value);
    this.styleSheet.insertRule(newCssText, ruleIndex);
    var newRule = this.styleSheet.cssRules[ruleIndex];
    var newCssTextModel = new CssTextModel(newRule.cssText);
    var updateResult = newCssTextModel.getUpdateResult(cssTextModel, name);
    if(!updateResult.successful) {
      this.styleSheet.deleteRule(ruleIndex); // delete new rule with failed update
      throw new InvalidPropertyValueError(name, value);
    }
    // successful, so remove previous version of rule
    this.styleSheet.deleteRule(ruleIndex+1);
    return {rule: newRule, cssTextModel: newCssTextModel, newValue: updateResult.newValue};
  }, 
  
  populateRules: function() {
    var rules = this.styleSheet.cssRules;
    this.rulesList = [];
    for (var i=0; i<rules.length; i++) {
      var rule = rules[i];
      if(rule.type == 1) {
        this.rulesList.push(new RuleModel(this, i, rule));
      }
    }
  }, 
  
  getCssChangesText: function() {
    var changeTexts = [];
    for (var i=0; i<this.rulesList.length; i++) {
      var ruleModel = this.rulesList[i];
      if (ruleModel.changed.get()) {
        changeTexts.push(ruleModel.getCssChangesText());
      }
    }
    if (changeTexts.length == 0) {
      return null;
    }
    else {
      return "/** " + this.styleSheet.href + " **/\n\n" + changeTexts.join("\n") + "\n";
    }
  }, 
  
  setExpandedOnAllVisibleRules: function(expanded) {
    for (var i=0; i<this.rulesList.length; i++) {
      var ruleModel = this.rulesList[i];
      if (ruleModel.filtered.get() || ruleModel.selected.get()) {
        ruleModel.expanded.set(expanded);
      }
    }
  }, 
  
  filterRules: function() {
    for (var i=0; i<this.rulesList.length; i++) {
      this.rulesList[i].filterRule();
    }
  }, 
  
  findRulesToEdit: function() {
    this.rulesToEdit = [];
    for (var i=0; i<this.rulesList.length; i++) {
      var ruleModel = this.rulesList[i];
      if (ruleModel.selected.get()) {
        ruleModel.findPropertiesToEdit();
        if(ruleModel.propertiesToEdit.length > 0) {
          this.rulesToEdit.push(ruleModel);
        }
      }
    }
  }
}

function RuleModel(styleSheetModel, index, rule) {
  this.styleSheetModel = styleSheetModel;
  this.styleAdjusterModel = styleSheetModel.styleAdjusterModel;
  this.index = index;
  this.rule = rule;
  this.filtered = new Observable(true);
  this.selected = new Observable(false);
  this.expanded = new Observable(false);
  this.properties = null;
  this.changed = new Observable(false);
  var $this = this;
  this.selected.onChange(function(selected) {
    $this.filterRule();
    var properties = $this.properties;
    if (!selected && properties != null) {
      for (var i=0; i<properties.length; i++) {
        properties[i].selected.set(false);
      }
    }
  });
}
  
RuleModel.prototype = {
  filterRule: function() {
    var filterText = this.styleAdjusterModel.rulesFilterText;
    var onlyShowSelected = this.styleAdjusterModel.onlyShowSelected;
    var matchesFilter = filterText == "" || this.rule.selectorText.indexOf(filterText) != -1;
    this.filtered.set(matchesFilter && (onlyShowSelected ? this.selected.get() : true));
  }, 
  
  getCssChangesText: function() {
    var changeLines = [this.rule.selectorText + " {"];
      for (var i=0; i<this.properties.length; i++) {
        var propertyModel = this.properties[i];
        if (propertyModel.changed.get()) {
          changeLines.push("  " + propertyModel.name + ": " + propertyModel.value.get() + ";");
        }
      }
    changeLines.push("}\n");
    return changeLines.join("\n");
  }, 
    
  updateChanged: function() {
    var changed = false;
    if (this.properties != null) {
      for (var i=0; i<this.properties.length; i++) {
        if (this.properties[i].changed.get()) {
          changed = true;
        }
      }
    }
    this.changed.set(changed);
  }, 
  
  // lazy getter for this.properties
  getPropertyModels: function() {
    if (this.properties == null) {
      this.createPropertyModels();
    }
    return this.properties;
  }, 
  
  createPropertyModels: function() {
    var cssText = this.rule.cssText;
    this.properties = [];
    this.cssTextModel = new CssTextModel(cssText);
    this.hasPropertyError = false;
    if (this.cssTextModel.error == null) {
      var cssPropertyModels = this.cssTextModel.properties;
      var namesByValue = {};
      for (var i=0; i<cssPropertyModels.length; i++) {
        var cssPropertyModel = cssPropertyModels[i];
        if (cssPropertyModel.error != null) {
          if (!this.hasPropertyError) {
            this.hasPropertyError = true;
            $(this).trigger("propertyError");
          }
        }
        var propertyModel = new PropertyModel(this, cssPropertyModel.name, cssPropertyModel.value, 
                                              cssPropertyModel.propertyText, cssPropertyModel.error);
        var $this = this;
        propertyModel.changed.onChange(function(changed) { $this.updateChanged(); });
        this.properties.push(propertyModel);
      }
    }
  }, 
  
  /** The RuleModel is responsible for updating a property value, because the Browser DOM API
      does not allow updating of individual (unexpanded) CSS properties - you have to insert a new
      rule and delete the old rule. */
  setPropertyValue: function(propertyModel, value) {
    var name = propertyModel.name;
    var newCssText = this.cssTextModel.cssTextForUpdated(name, value);
    var updateResult = this.styleSheetModel.updatePropertyValue(this.index, name, value, this.cssTextModel);
    this.rule = updateResult.rule;
    this.cssTextModel = updateResult.cssTextModel;
    var newValue = updateResult.newValue; // The DOM API will have normalised the new saved value for the property
    propertyModel.value.set(newValue);
  }, 
  
  findPropertiesToEdit: function() {
    this.propertiesToEdit = [];
    if (this.properties != null) {
      for (var i=0; i<this.properties.length; i++) {
        var property = this.properties[i];
        if(property.selected.get()) {
          this.propertiesToEdit.push(property);
        }
      }
    }
  }
}

function PropertyModel(ruleModel, name, value, propertyText, error) {
  this.ruleModel = ruleModel;
  this.styleAdjusterModel = ruleModel.styleAdjusterModel;
  this.name = name;
  this.originalValue = value;
  this.value = new Observable(value);
  this.propertyText = propertyText;
  this.beingEdited = new Observable(false);
  this.error = error;
  this.selected = new Observable(false);
  this.changed = new Observable(false);
  var $this = this;
  this.selected.onChange(function(selected) {
    if(selected) {
      $this.ruleModel.selected.set(true);
    }
  });
}

PropertyModel.prototype = {

  editThisProperty: function() {
    this.styleAdjusterModel.editProperty(this);
  }, 
  
  updateValue: function(value) {
    this.ruleModel.setPropertyValue(this, value);
    this.changed.set(this.value.get() != this.originalValue);
  }, 
  
  resetValue: function() {
    this.updateValue(this.originalValue);
  }, 
  
  getExtraEditorModel: function() {
    var name = this.name;
    var propertyEditorModel = propertyEditorModels[name];
    if (propertyEditorModel) {
      return propertyEditorModel;
    }
    else if (this.value.get().match(CssSizeEditorModel.prototype.cssSizeRegex)) {
      return cssSize1ComponentEditorModel;
    }
    else {
      return null;
    }
  }
}

function CssPropertyModel(propertyText) {
  this.propertyText = propertyText;
  this.error = null;
  var colonPos = propertyText.indexOf(":");
  if (colonPos == -1) {
    this.error = "No colon in property definition";
    return;
  }
  this.name = trim(propertyText.substring(0, colonPos));
  this.value = trim(propertyText.substring(colonPos+1, propertyText.length));
};

CssPropertyModel.prototype = {
  cssTextForUpdated: function(name, value) {
    return this.name + ": " + (name == this.name ? value : this.value);
  }, 
  toCssSource: function() {
    if (this.error) {
      return "ERROR " + this.error + ": " + this.propertyText;
    }
    return this.name + ": " + this.value;
  }
};

function CssTextModel(cssText) {
  this.cssText = cssText;
  this.error = null;
  this.properties = [];
  var openBracePos = cssText.indexOf("{");
  if (openBracePos == -1) {
    this.error = "No opening brace in cssText";
    return;
  }
  var closeBracePos = cssText.lastIndexOf("}");
  if (closeBracePos == -1) {
    this.error = "No closing brace in cssText";
    return;
  }
  this.selectorText = this.cssText.substring(0, openBracePos);
  var propertiesText = this.cssText.substring(openBracePos+1, closeBracePos);
  var propertyTexts = propertiesText.split("; ");
  for (var i=0; i<propertyTexts.length; i++) {
    var propertyText = trim(propertyTexts[i]);
    if (propertyText != "") {
      this.properties.push (new CssPropertyModel(propertyText));
    }
  }
}

CssTextModel.prototype = {

  cssTextForUpdated: function(name, value) {
    var textItems = [this.selectorText + " { "];
    for (var i=0; i<this.properties.length; i++) {
      textItems.push(this.properties[i].cssTextForUpdated(name, value));
      textItems.push("; ");
    }
    textItems.push("}");
    return textItems.join("");
  }, 
  
  getUpdateResult: function(cssTextModel, name) {
    var successful = true;
    var newValue = null;
    if (this.properties.length != cssTextModel.properties.length) {
      successful = false;
    }
    for (var i=0; i<this.properties.length; i++) {
      var property = this.properties[i];
      var oldProperty = cssTextModel.properties[i];
      if (property.name != oldProperty.name) {
        successful = false;
      }
      if (property.name == name) {
        newValue = property.value;
      }
      else {
        if (property.value != oldProperty.value) {
          successful = false;
        }
      }
    }
    return {successful: successful, newValue: newValue};
  }, 
  
  toIndentedCssSource: function() {
    if (this.error) {
      return "ERROR " + this.error + ": " + this.cssText;
    }
    var lines = [this.selectorText + " {"];
    for (var i=0; i<this.properties.length; i++) {
      lines.push("  " + this.properties[i].toCssSource());
    }
    lines.push("}");
    return lines.join("\n");
  }
};


function ValueEditorModel() {
  this.propertyModel = new Observable(null);
  this.name = new Observable("");
  this.value = new Observable("");
  this.changed = new Observable(false);
  this.errorMessage = new Observable(null);
  this.extraEditorModel = new Observable(null);
}

ValueEditorModel.prototype = {
  clearErrorMessage: function() {
    this.errorMessage.set(null);
  }, 
  
  clear: function() {
    this.name.set(null);
    this.value.set(null);
    this.changed.set(false);
    this.errorMessage.set(null);
  }, 
  
  editProperty: function(propertyModel) {
    this.clear();
    this.propertyModel.set(propertyModel);
    this.name.set(propertyModel.name);
    this.value.set(propertyModel.value.get());
    this.changed.set(propertyModel.changed.get());
    this.setExtraEditorModelFor(propertyModel);
  }, 
  
  setExtraEditorModelFor: function(propertyModel) {
    var extraEditorModel = propertyModel.getExtraEditorModel();
    if (extraEditorModel != null) {
      extraEditorModel.setValueString(propertyModel.value.get());
      var $this = this;
      extraEditorModel.onUpdateValue(function(value) {
        $this.saveValue(value, true);
      });
    }
    this.extraEditorModel.set(extraEditorModel);
  },
  
  handleSaveError: function(error) {
    if (error instanceof InvalidPropertyValueError) {
      this.errorMessage.set(error.message);
    }
    else {
      this.errorMessage.set("ERROR SAVING: " + error.message);
      console.log("error = " + error);
      throw error;
    }
  }, 
  
  saveValue: function(value, fromExtraModelEditor) {
    this.clearErrorMessage();
    try {
      this.value.set(value);
      this.propertyModel.get().updateValue(value);
      this.updateFromPropertyModel(fromExtraModelEditor);
    }
    catch(error) {
      this.handleSaveError(error);
    }
  }, 
  
  resetValue: function() {
    this.clearErrorMessage();
    try {
      this.propertyModel.get().resetValue();
      this.updateFromPropertyModel(false);
    }
    catch(error) { // this shouldn't happen resetting, but just in case ...
      this.handleSaveError(error);
    }
  }, 
  
  updateFromPropertyModel: function(fromExtraModelEditor) {
    var propertyModel = this.propertyModel.get();
    var value = propertyModel.value.get();
    this.value.set(value);
    this.changed.set(propertyModel.changed.get());
    if(!fromExtraModelEditor) {
      var extraEditorModel = this.extraEditorModel.get();
      if (extraEditorModel != null) {
        extraEditorModel.setValueString(value);
      }
    }
  }
  
};

/** ===== Application Views (& helpers) =================================================================== */

function hrefSpan(tagExpression, href) {
  var tag = $(tagExpression);
  if (href == null) {
    tag.addClass("no-href");
    tag.text("(no URL)");
  }
  else {
    tag.text(href);
  }
  return tag;
}

function StyleAdjusterView(parentDom, styleAdjusterModel) {
  this.parentDom = parentDom;
  this.styleAdjusterModel = styleAdjusterModel;
  this.dom = $("<div title='Style Adjuster'/>");
  this.tabsDom = $("<div class = 'style-adjuster'/>").appendTo(this.dom);
  this.tabsHeadersDom = $("<ul/>").appendTo(this.tabsDom);
  this.tabsById = {}
  
  this.styleSheetsView = new StyleSheetsView(styleAdjusterModel);
  this.addTab("sheets", "Style Sheets", this.styleSheetsView);
  
  this.rulesView = new RulesView(this.styleAdjusterModel);
  this.addTab("rules", "Rules", this.rulesView);
  
  this.editView = new EditView(this.styleAdjusterModel);
  this.addTab("edit", "Edit", this.editView);
  
  this.changesView = new ChangesView(this.styleAdjusterModel);
  this.addTab("changes", "Changes", this.changesView);
  
  this.helpView = new HelpView();
  this.addTab("help", "Help", this.helpView);
  
  $this = this;
  this.dom.tabs({active: 1, activate: function(event, ui) {
    var tabId = ui.newPanel[0].id;
    var tabView = $this.tabsById[tabId];
    if (tabView.activate) {
      $this.tabsById[tabId].activate();
    }
  }});
  this.tabsDom.find("> ul > li:last-child").css("float", "right");
  this.configureAsDialog();
}

StyleAdjusterView.prototype = {
  configureAsDialog: function() {
    this.dom.dialog({appendTo: this.parentDom, 
                     width: 800, 
                     height: 700});
    this.dom.dialog("widget").draggable("option","containment", false);
  }, 
  
  addTab: function(id, label, view) {
    this.tabsById[id] = view;
    this.tabsHeadersDom.append($("<li/>").append($("<a/>").attr("href", "#" + id).text(label)));
    var tabDiv = $("<div/>").attr("id", id).append(view.dom).appendTo(this.tabsDom);
  }, 
  toggle: function() {
    var isOpen = this.dom.dialog("isOpen");
    this.dom.dialog (isOpen ? "close" : "open");
  }
};

function HelpView() {
  this.dom = $("<div class='help'/>");
  this.dom.load("lib/help.html");
}

function StyleSheetsView(styleAdjusterModel) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.dom = $("<div class='style-sheets'/>");
  var styleSheetsList = styleAdjusterModel.styleSheetsList;
  for (var i=0; i<styleSheetsList.length; i++) {
    var styleSheetItemModel = styleSheetsList[i];
    var styleSheetItemView = new StyleSheetItemView(styleSheetItemModel);
    this.dom.append(styleSheetItemView.dom);
  }
}

function StyleSheetItemView(styleSheetItemModel) {
  this.styleSheetItemModel = styleSheetItemModel;
  this.dom = $("<div class='style-sheet'>");
  var labelDom = $("<label/>").appendTo(this.dom);
  this.selectCheckbox = $("<input type='checkbox'/>").appendTo(labelDom);
  this.selectCheckbox.prop("checked", this.styleSheetItemModel.selected);
  this.selectCheckbox.on("change", function(event) {
    styleSheetItemModel.selected = this.checked;
  });
  hrefSpan("<span class='href'>", styleSheetItemModel.styleSheet.href).appendTo(labelDom);
}

function RulesView(styleAdjusterModel) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.dom = $("<div class='rules'></div>");
  var filterDiv = $("<div class = 'filter'/>").text("Filter: ").appendTo(this.dom);
  this.filterTextField = $("<input type = 'text' size = '30'/>").appendTo(filterDiv);
  var controlsDiv = $("<div/>").appendTo(this.dom);
  this.onlyShowSelectedCheckbox = $("<input type='checkbox'/>");
  var onlyShowSelectedLabel = $("<label class='checkbox'/>").append(this.onlyShowSelectedCheckbox, "Only show selected");
  var expandAllButton = $("<button/>").text("+ all");
  var unexpandAllButton = $("<button/>").text("- all");
  controlsDiv.append(onlyShowSelectedLabel, " ", expandAllButton, " ", unexpandAllButton);
  var $this = this;
  this.filterTextField.on("input", function(event, ui) {
    $this.filterOnText($(this).val());
  });
  this.onlyShowSelectedCheckbox.on("change", function(event) {
    $this.styleAdjusterModel.setOnlyShowSelected(this.checked);
  });
  this.emptyMessageDom = $("<div class='empty-message'>").text("(No style sheets have been selected)").hide();
  this.dom.append(this.emptyMessageDom);
  var styleSheetModels = this.styleAdjusterModel.styleSheetsList;
  this.styleSheetRulesViews = [];
  for (var i=0; i<styleSheetModels.length; i++) {
    var styleSheetRulesView = new StyleSheetRulesView(styleSheetModels[i]);
    this.styleSheetRulesViews.push(styleSheetRulesView);
    this.dom.append(styleSheetRulesView.dom);
  }
  var $this = this;
  expandAllButton.on("click", function(event, ui) {
    $this.styleAdjusterModel.setExpandedOnAllVisibleRules(true);
  });
  unexpandAllButton.on("click", function(event, ui) {
    $this.styleAdjusterModel.setExpandedOnAllVisibleRules(false);
  });
}

RulesView.prototype = {
  activate: function() {
    this.updateFromStyleSheetSelections();
    this.filterTextField.focus();
  }, 
  
  updateFromStyleSheetSelections: function() {
    var numSelected = 0;
    for (var i=0; i<this.styleSheetRulesViews.length; i++) {
      var styleSheetRulesView = this.styleSheetRulesViews[i];
      styleSheetRulesView.updateFromStyleSheetSelection();
      numSelected += styleSheetRulesView.styleSheetModel.selected ? 1 : 0;
    }
    this.emptyMessageDom.toggle(numSelected == 0);
  },
  
  filterOnText: function(text) {
    this.styleAdjusterModel.filterRulesOn(text);
    this.dom.toggleClass("filtering", this.styleAdjusterModel.rulesFilterText != "");
  }
};

function StyleSheetRulesView(styleSheetModel) {
  this.styleSheetModel = styleSheetModel;
  this.dom = $("<div class='style-rules'></div>");
  hrefSpan("<h2 class='href'/>", styleSheetModel.styleSheet.href).appendTo(this.dom);
  var ruleModelsList = styleSheetModel.rulesList;
  this.ruleViews = [];
  for (var j=0; j<ruleModelsList.length; j++) {
    var ruleModel = ruleModelsList[j];
    var ruleView = new RuleView(ruleModel);
    ruleView.dom.appendTo(this.dom);
    this.ruleViews.push(ruleView);
  }
  this.updateFromStyleSheetSelection();
}

StyleSheetRulesView.prototype = {
  updateFromStyleSheetSelection: function() {
    this.dom.toggle(this.styleSheetModel.selected);
  }, 
};
    
function RuleView(ruleModel) {
  this.ruleModel = ruleModel;
  this.dom = $("<div class='rule'/>");
  
  this.addExpandButton();
  var labelDom = $("<label/>").appendTo(this.dom);
  this.addSelectCheckBox(labelDom);
  this.selectorTextDom = $("<span class='selector'/>").text(this.ruleModel.rule.selectorText);
  labelDom.append(this.selectorTextDom);

  this.propertiesDom = null; // defer creation until required
  this.propertyViews = null;

  var $this = this;
  this.ruleModel.selected.nowAndOnChange(function(selected) {
    $this.selectCheckbox.prop("checked", selected);
    $this.dom.toggle($this.ruleModel.filtered.get() || selected);
  });
  this.ruleModel.filtered.nowAndOnChange(function(filtered) {
    $this.dom.toggle(filtered || $this.ruleModel.selected.get());
    $this.dom.toggleClass("filtered", filtered);
  });
  this.ruleModel.expanded.nowAndOnChange(function(expanded) {
    $this.updateFromModelExpansion(expanded);
  });
  this.ruleModel.changed.nowAndOnChange(function(changed) {
    $this.selectorTextDom.toggleClass("rule-value-changed", changed);
    $this.selectCheckbox.prop("disabled", changed);
  });
  $(this.ruleModel).on("propertyError", function(event) {
    $this.selectCheckbox.prop("disabled", true);
    $this.dom.addClass("property-error");
    if (this.propertyViews != null) {
      for (var i=0; i<$this.propertyViews.length; i++) {
        var propertyView = $this.propertyViews[i];
        propertyView.selectCheckbox.prop("disabled", true);
      }
    }
  });
}

RuleView.prototype = {
  addSelectCheckBox: function(parentDom) {
    this.selectCheckbox = $("<input type='checkbox'/>").appendTo(parentDom);
    this.selectCheckbox.prop("checked", this.ruleModel.selected.get());
    var $this = this;
    this.selectCheckbox.on("change", function(event) {
      $this.ruleModel.selected.set(this.checked);
    });
  }, 
  
  addExpandButton: function() {
    this.expandButton = $("<button class='expand'/>").appendTo(this.dom);
    var $this = this;
    this.expandButton.on("click", function(event) {
      $this.ruleModel.expanded.set(!$this.expanded);
    });
  }, 
  
  updateFromModelExpansion: function(expanded) {
    this.expanded = expanded;
    this.expandButton.text(expanded ? "-" : "+");
    if(expanded && this.propertiesDom == null) {
      this.propertiesDom = $("<div class='properties'/>").appendTo(this.dom);
      var properties = this.ruleModel.getPropertyModels();
      this.propertyViews = [];
      for (var i=0; i<properties.length; i++) {
        var property = properties[i];
        var propertyView = new PropertyView(this, property);
        this.propertyViews.push(propertyView);
        this.propertiesDom.append(propertyView.dom);
      }
    }
    if (this.propertiesDom != null) {
      this.propertiesDom.toggle(expanded);
    }
  }
};

function PropertyView(ruleView, propertyModel) {
  this.ruleView = ruleView;
  this.propertyModel = propertyModel;
  this.dom = $("<div class='property'/>");
  var labelDom = $("<label/>").appendTo(this.dom);
  this.addSelectCheckBox(labelDom);
  if (propertyModel.error == null) {
    this.nameAndValueDom = $("<span class='name-and-value'/>");
    this.nameDom = $("<span class='name'/>").text(this.propertyModel.name);
    var separatorDom = $("<span class='separator'/>").text(": ");
    this.propertyValueView = new PropertyValueView(propertyModel);
    this.nameAndValueDom.append(this.nameDom, separatorDom, this.propertyValueView.dom);
    labelDom.append(this.nameAndValueDom);
  }
  else {
    this.propertyTextDom = $("<span class='property-text'/>").text(this.propertyModel.propertyText);
    this.errorDom = $("<span class='property-error'/>").text(this.propertyModel.error);
    labelDom.append(this.propertyTextDom, " ", this.errorDom);
    this.selectCheckbox.prop("disabled", true);
  }
  if(ruleView.ruleModel.hasPropertyError) {
    this.selectCheckbox.prop("disabled", true);
  }    
  var $this = this;
  this.propertyModel.selected.nowAndOnChange(function(selected) {
    $this.selectCheckbox.prop("checked", selected);
  });
  this.propertyModel.changed.nowAndOnChange(function(changed) {
    $this.selectCheckbox.prop("disabled", changed);
  });
}

PropertyView.prototype = {
  addSelectCheckBox: function(parentDom) {
    this.selectCheckbox = $("<input type='checkbox'/>").appendTo(parentDom);
    this.selectCheckbox.prop("checked", this.propertyModel.selected);
    var $this = this;
    this.selectCheckbox.on("change", function(event) {
      $this.propertyModel.selected.set(this.checked);
    });
  }, 
};

function PropertyValueView(propertyModel) {
  this.propertyModel = propertyModel;
  this.dom = $("<span/>");
  this.valueDom = $("<span class='value'/>").appendTo(this.dom);
  this.originalValueDom = $("<span class='original-value'/>").appendTo(this.dom);
  var $this = this;
  this.propertyModel.changed.nowAndOnChange(function(changed) {
    $this.valueDom.toggleClass('changed-value', changed);
    $this.originalValueDom.text(changed
                                ? (" (original value = " + $this.propertyModel.originalValue + ")") : "");
  }); 
  this.propertyModel.value.nowAndOnChange(function(value) {
    $this.valueDom.text(value);
  });
};  

function EditView(styleAdjusterModel) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.dom = $("<div class='edit'></div>");
  this.emptyMessageDom = $("<div class='empty-message'>").text("(No properties have been selected)").hide();
  this.dom.append(this.emptyMessageDom);
  this.valueEditorView = new ValueEditorView(styleAdjusterModel.valueEditorModel);
  this.dom.append(this.valueEditorView.dom);
  this.propertiesWrapperDom = $("<div class='properties-wrapper'/>").appendTo(this.dom);
}

EditView.prototype = {
  activate: function() {
    this.styleAdjusterModel.clearPropertyEditor();
    this.propertiesWrapperDom.empty();
    this.styleAdjusterModel.findStyleSheetsToEdit();
    var styleSheetsToEdit = this.styleAdjusterModel.styleSheetsToEdit;
    for (var i=0; i<styleSheetsToEdit.length; i++) {
      var styleSheetModel = styleSheetsToEdit[i];
      this.propertiesWrapperDom.append(new StyleSheetEditView(styleSheetModel).dom);
    }
    this.emptyMessageDom.toggle(styleSheetsToEdit.length == 0);
  }, 
}

function StyleSheetEditView(styleSheetModel) {
  this.styleSheetModel = styleSheetModel;
  this.hrefDom = hrefSpan("<span class='href'/>", styleSheetModel.styleSheet.href);
  this.dom = $("<div class='edit-style-sheet'/>").append(this.hrefDom);
  var rulesToEdit = styleSheetModel.rulesToEdit;
  for (var i=0; i<rulesToEdit.length; i++) {
    var ruleModel = rulesToEdit[i];
    this.dom.append(new RuleEditView(ruleModel).dom);
  }
}

function RuleEditView(ruleModel) {
  this.ruleModel = ruleModel;
  this.selectorTextDom = $("<span class='selector'/>").text(this.ruleModel.rule.selectorText);
  this.dom = $("<div class='edit-rule'/>").append(this.selectorTextDom);
  var propertiesToEdit = ruleModel.propertiesToEdit;
  for (var i=0; i<propertiesToEdit.length; i++) {
    var property = propertiesToEdit[i];
    this.dom.append(new PropertyEditView(property).dom);
  }
  var $this = this;
  ruleModel.changed.nowAndOnChange(function(changed) {
    $this.selectorTextDom.toggleClass("rule-value-changed", changed);
  });
}

function PropertyEditView(propertyModel) {
  this.propertyModel = propertyModel;
  this.dom = $("<div class='edit-property'/>");
  this.nameDom = $("<span class='name'/>").text(propertyModel.name);
  var separatorDom = $("<span class='separator'/>").text(": ");
  this.propertyValueView = new PropertyValueView(propertyModel);
  this.dom.append(this.nameDom, separatorDom, this.propertyValueView.dom);
  var $this = this;
  this.dom.on("click", function(event, ui) {
    $this.propertyModel.editThisProperty();
  });
  this.propertyModel.beingEdited.nowAndOnChange(function(beingEdited) {
    $this.dom.toggleClass("being-edited", beingEdited);
  });
}

function ValueEditorView(valueEditorModel) {
  this.valueEditorModel = valueEditorModel;
  this.dom = $("<div class='value-editor'/>");
  this.topRowDom = $("<div/>").appendTo(this.dom);
  this.nameDom = $("<span class='name'/>");
  this.valueField = $("<input type='text'>");
  this.saveButton = $("<button/>").text("Save");
  this.saveButton.prop("disabled", true);
  this.resetButton = $("<button/>").text("Reset");
  this.topRowDom.append(this.nameDom, " ", this.valueField, this.saveButton, this.resetButton);
  this.errorMessageDom = $("<div class='error-message'/>").appendTo(this.dom);
  this.errorMessageDom.hide();
  this.extraEditorDom = $("<div class='extra-editor'/>").appendTo(this.dom);
  this.propertyModel = null;
  this.extraEditorView = null;
  var $this = this;
  var valueEditorModel = this.valueEditorModel;
  this.saveButton.on("click", function(event, ui) {
    $this.saveValue();
  });
  this.resetButton.on("click", function(event, ui) {
    valueEditorModel.resetValue();
  });
  this.valueField.on("keypress", function(event, ui) {
    if (event.which == 13) {
      $this.saveValue();
    }
  });
  this.valueField.on("input", function(event, ui) {
    $this.saveButton.prop("disabled", false);
  });
  this.valueEditorModel.name.nowAndOnChange(function(name) {
    $this.nameDom.text(name);
  });
  this.valueEditorModel.value.nowAndOnChange(function(value) {
    $this.valueField.val(value);
  });
  this.valueEditorModel.changed.nowAndOnChange(function(changed) {
    $this.resetButton.prop("disabled", !changed);
  });
  this.valueEditorModel.errorMessage.nowAndOnChange(function(errorMessage) {
    $this.errorMessageDom.toggle(errorMessage != null);
    $this.errorMessageDom.text(errorMessage);
  });
  this.valueEditorModel.propertyModel.nowAndOnChange(function(propertyModel) {
    $this.dom.toggle(propertyModel != null);
    if (propertyModel != null) {
      $this.valueField.focus();
    }
  });
  this.valueEditorModel.extraEditorModel.nowAndOnChange(function(extraEditorModel) {
    $this.extraEditorDom.children().detach();
    var extraEditorView = extraEditorModel == null ? null : extraEditorModel.view;
    if (extraEditorView == null) {
      $this.extraEditorDom.hide();
    }
    else {
      $this.extraEditorDom.append(extraEditorView.dom);
      $this.extraEditorDom.show();
    };
  });
}

ValueEditorView.prototype = {
  saveValue: function() {
    this.saveButton.prop("disabled", true);
    this.valueEditorModel.saveValue(this.valueField.val());
  }
};

function ChangesView(styleAdjusterModel) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.dom = $("<div class='changes'/>");
  this.selectButton = $("<button/>").text("Select").appendTo(this.dom);
  var $this = this;
  this.selectButton.on("click", function(event, ui) {
    selectDomElementContents($this.cssDom[0]);
  });
  this.cssDom = $("<pre/>").appendTo(this.dom);
}

ChangesView.prototype = {
  activate: function() {
    this.cssDom.empty();
    this.cssDom.text(this.styleAdjusterModel.getCssChangesText());
  }
};

/** ===== CSS value editors  ==================================================== */

function CssSize (number, unit, precision) {
  this.number = number;
  this.unit = unit;
  this.precision = precision;
}

CssSize.prototype = {
  toString: function() {
    return this.number.toFixed(this.precision) + this.unit;
  }
};

function Range(lower, upper) {
  this.lower = lower;
  this.upper = upper;
  this.size = upper-lower;
}

Range.prototype = {
  valueAtPosition: function(position) { // position 0 => lower, position 1 => upper
    return this.lower + this.size * position;
  }, 
  positionForValue: function(value) {
    return (value-this.lower)/this.size;
  }, 
  toString: function() {
    return "Range[" + this.lower + "-" + this.upper + " (size = " + this.size + ")]";
  }
};

function RegexParserAndBuilder(regex, matchLabels, beforeTexts) {
  this.regex = regex;
  this.matchLabels = matchLabels;
  this.labels = []
  for (var i=0; i<this.matchLabels.length; i++) {
    var matchLabel = this.matchLabels[i];
    if (matchLabel != null) {
      this.labels.push(matchLabel);
    }
  }
  this.beforeTexts = beforeTexts;
}

RegexParserAndBuilder.prototype = {
  parseValue: function(value) {
    var match = value.match(this.regex);
    if (match == null) {
      return null;
    }
    else {
      var values = {};
      for (var i=0; i<this.matchLabels.length; i++) {
        var matchLabel = this.matchLabels[i];
        if (matchLabel != null) {
          values[matchLabel] = match[i];
        }
      }
    }
    return values;
  }, 
  buildValue: function(values) {
    var parts = [];
    for (var i=0; i<this.matchLabels.length; i++) {
      var matchLabel = this.matchLabels[i];
      if (matchLabel != null) {
        var beforeText = this.beforeTexts[matchLabel];
        if (beforeText) {
          parts.push(beforeText);
        }
        parts.push(values[matchLabel]);
      }
    }
    return parts.join("");
  }
};

function ValueParserAndBuilder(componentParsersAndBuilders) {
  this.componentParsersAndBuilders = componentParsersAndBuilders;
  this.matchedParserAndBuilder = null;
  this.parsedLabels = [];
  this.values = null;
}

ValueParserAndBuilder.prototype = {
  parseValue: function(value) {
    this.values = null;
    this.matchedParserAndBuilder = null;
    this.parsedLabels = [];
    for (var i=0; i<this.componentParsersAndBuilders.length && this.values == null; i++) {
      var componentParserAndBuilder = this.componentParsersAndBuilders[i];
      this.values = componentParserAndBuilder.parseValue(value);
      if (this.values != null) {
        this.matchedParserAndBuilder = componentParserAndBuilder;
        var parserLabels = componentParserAndBuilder.labels;
        this.parsedLabels = [];
        for (var i=0; i<parserLabels.length; i++) {
          var parserLabel = parserLabels[i];
          if (this.values[parserLabel]) {
            this.parsedLabels.push(parserLabel);
          }
        }
      }
    }
  }, 
  updateValue: function(label, value) {
    this.values[label] = value;
  }, 
  buildValue: function() {
    if (this.matchedParserAndBuilder == null) {
      return null;
    }
    else {
      return this.matchedParserAndBuilder.buildValue(this.values);
    }
  }
}

function ComponentsEditorModel(valueParserAndBuilder, labels, editorModels) {
  this.view = null;
  this.valueParserAndBuilder = valueParserAndBuilder;
  this.labels = labels;
  this.editorModels = editorModels;
  this.updateValueHandler = null;
  this.parsedLabels = new Observable([]);
  for (var i=0; i<labels.length; i++) {
    var label = labels[i];
    var editorModel = editorModels[label];
    this.handleValueUpdateFrom(label, editorModel);
  }
}

ComponentsEditorModel.prototype = {
  onUpdateValue: function(handler) {
    this.updateValueHandler = handler;
  }, 
  setValueString: function(valueString) {
    this.valueParserAndBuilder.parseValue(valueString);
    var parsedLabels = this.valueParserAndBuilder.parsedLabels;
    this.parsedLabels.set(parsedLabels);
    for (var i=0; i<parsedLabels.length; i++) {
      var label = parsedLabels[i];
      var editorModel = this.editorModels[label];
      editorModel.setValueString(this.valueParserAndBuilder.values[label]);
    }
  }, 
  handleValueUpdateFrom: function(label, editorModel) {
    var $this = this;
    editorModel.onUpdateValue(function(value) {
      $this.updateValue(label, value);
    });
  }, 
  updateValue: function(label, value) {
    if (this.valueParserAndBuilder) {
      this.valueParserAndBuilder.updateValue(label, value);
      var newValue = this.valueParserAndBuilder.buildValue();
      if (newValue != null && this.updateValueHandler != null) {
        this.updateValueHandler(newValue);
      }
    }
  }
};

function ComponentsEditorView(componentsEditorModel) {
  this.componentsEditorModel = componentsEditorModel;
  componentsEditorModel.view = this;
  this.dom = $("<div/>");
  var editorModels = componentsEditorModel.editorModels;
  var labels = componentsEditorModel.labels;
  for (var i=0; i<labels.length; i++) {
    var label = labels[i];
    var editorModel = editorModels[label];
    this.dom.append(editorModel.view.dom);
  }
  var $this = this;
  componentsEditorModel.parsedLabels.nowAndOnChange(function(parsedLabels) {
    $this.showModelsForLabels(parsedLabels);
  });
}

ComponentsEditorView.prototype = {
  showModelsForLabels: function(parsedLabels) {
    var labels = this.componentsEditorModel.labels;
    var editorModels = this.componentsEditorModel.editorModels;
    for (var i=0; i<labels.length; i++) {
      var label = labels[i];
      var editorModel = editorModels[label];
      var active = $.inArray(label, parsedLabels) != -1;
      editorModel.view.dom.toggle(active);
    }
  }
};

function CssSizeEditorModel() {
  this.view = null; // The view should set this
  this.cssSize = new Observable(null);
  this.precision = 1;
  this.negativeAllowed = false;
  this.range = new Observable(new Range(0, 1));
  this.updateValueHandler = null;
}

CssSizeEditorModel.prototype = {
  cssSizeRegex: /^([-]?[0-9.]+)(%|in|cm|mm|px|pt|em|ex|rem|pc)$/, 
  
  onUpdateValue: function(handler) {
    this.updateValueHandler = handler;
  }, 
  
  setValueString: function(valueString) {
    this.valueString = valueString;
    var match = this.cssSizeRegex.exec(valueString);
    if (match) {
      this.cssSize.set(new CssSize(parseFloat(match[1]), match[2], this.precision));
      this.rescale();
    }
    else {
      this.cssSize.set(null); // shouldn't happen?
    }
  }, 
  
  setCssSizeFromPosition: function(position) {
    var number = this.range.get().valueAtPosition(position);
    this.cssSize.get().number = number;
    this.cssSize.hasChanged();
    var newValueString = this.cssSize.get().toString();
    this.updateValue(newValueString);
  }, 
  
  updateValue: function(value) {
    if (this.updateValueHandler != null) {
      this.updateValueHandler(value);
    }
  }, 
  
  rescale: function() {
    var value = this.cssSize.get().number;
    if (this.negativeAllowed) {
      if (value > 0) {
        this.range.set(new Range(-value, 2*value));
      }
      else if (value == 0) {
        this.range.set(new Range(-10, 10)); // arbitrary ??
      }
      else { // value < 0
        this.range.set(new Range(2*value, -value));
      }
    }
    else {
      if (value == 0) {
        this.range.set(new Range(0, 10)); // arbitrary
      }
      else {
        this.range.set(new Range(0, 2*value));
      }
    }
  }
};

function CssSizeEditorView(cssSizeEditorModel) {
  this.cssSizeEditorModel = cssSizeEditorModel;
  cssSizeEditorModel.view = this;
  this.dom = $("<div class='size-slider'/>");
  this.lowerValueDom = $("<span class='value'/>");
  this.sliderDom = $("<div class='scale-slider'/>");
  this.upperValueDom = $("<span class='value'/>");
  this.unitDom = $("<span class='css-unit'/>");
  this.dom.append(this.lowerValueDom, " ", this.sliderDom, " ", this.upperValueDom, " ", this.unitDom);
  this.ignoreValueChanges = false;
  var $this = this;
  function sliderChanged(event, ui) {
    if (!$this.ignoreValueChanges) {
      var position = ui.value / 100.0;
      cssSizeEditorModel.setCssSizeFromPosition(position);
    }
  };
  this.sliderDom.slider({min: 0, max: 100, slide: sliderChanged, change: sliderChanged});
  this.cssSizeEditorModel.range.onChange(function(range) {
    $this.lowerValueDom.text(range.lower);
    $this.upperValueDom.text(range.upper);
    $this.ignoreValueChanges = true;
    var newPosition = range.positionForValue(cssSizeEditorModel.cssSize.get().number);
    $this.sliderDom.slider("option", "value", 100 * newPosition);
    $this.ignoreValueChanges = false;
  });
  this.cssSizeEditorModel.cssSize.onChange(function(cssSize) {
    $this.unitDom.text(cssSize ? cssSize.unit : null);
  });
}

/** ===== Specific model editors ==================================================== */

function sizeEditor(negativeAllowed) {
  var model = new CssSizeEditorModel();
  model.negativeAllowed = negativeAllowed;
  new CssSizeEditorView(model);
  return model;
}

var cssSizePattern = "[-]?[0-9.]+(%|in|cm|mm|px|pt|em|ex|rem|pc)"

var oneCssSizePattern = "^(" + cssSizePattern + ")$"
var oneCssSizeParserAndBuilder = 
  new RegexParserAndBuilder(new RegExp(oneCssSizePattern), 
                            [null, 
                             "size1", null], {size1: ""});

var cssSize1ComponentEditorModel 
  = new ComponentsEditorModel(new ValueParserAndBuilder([oneCssSizeParserAndBuilder]), 
                              ["size1"], 
                              {size1: sizeEditor(false)})
new ComponentsEditorView(cssSize1ComponentEditorModel);

var fourCssSizesPattern = "^(" + cssSizePattern + ")" 
  + "(\\s+(" + cssSizePattern + ")|)"
  + "(\\s+(" + cssSizePattern + ")|)"
  + "(\\s+(" + cssSizePattern + ")|)$";

var fourCssSizesParserAndBuilder = 
  new RegexParserAndBuilder(new RegExp(fourCssSizesPattern), 
                            [null, 
                             "size1", null, 
                             null, "size2", null, 
                             null, "size3", null, 
                             null, "size4", null], 
                            {size1: "", size2: " ", size3: " ", size4: " "});

function cssSize4ComponentsEditorModel(allowNegative) {
  var model = new ComponentsEditorModel(new ValueParserAndBuilder([fourCssSizesParserAndBuilder]), 
                                        ["size1", "size2", "size3", "size4"], 
                                        {size1: sizeEditor(allowNegative), 
                                         size2: sizeEditor(allowNegative), 
                                         size3: sizeEditor(allowNegative), 
                                         size4: sizeEditor(allowNegative)});
  new ComponentsEditorView(model);
  return model;
}

var propertyEditorModels = 
  {"margin": cssSize4ComponentsEditorModel(true), 
   "padding": cssSize4ComponentsEditorModel(false)};

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
