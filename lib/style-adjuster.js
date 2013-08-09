console.log("Start style-adjuster.js");

/** ===== Utility Functions & Classes ========================================================================= */

function inspect(object) {
  return JSON.stringify(object);
}

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
  toString: function() {
    return "[Observable " + this.description + ", value = " + this.value + "]";
  }, 
  
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
  this.type = propertyTypes.getType(name);
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
  
  setFormatsStateModel: function(formatsStateModel, initialValue) {
    this.formatsStateModel = formatsStateModel;
    formatsStateModel.setFormatsController(this.type.formatsController, initialValue)
  }, 
  
  updateValue: function(value) {
    if (this.type && this.type.formatsController) {
      this.updateValueViaFormatsController(value, this.type.formatsController);
    }
    else {
      this.updateValueDirectly(value);
    }
  }, 
  
  updateValueDirectly: function(value) {
    this.ruleModel.setPropertyValue(this, value);
    var updatedValue = this.value.get();
    if (this.type) {
      if (this.type.denormaliser) {
        updatedValue = this.type.denormaliser.denormalise(value, updatedValue);
        this.value.set(updatedValue);
      }
    }
    this.changed.set(updatedValue != this.originalValue);
  }, 
  
  updateValueViaFormatsController: function(value, formatsController) {
    var parsedValue = formatsController.parseValue(value);
    if (parsedValue == null) {
      console.log("Formats Controller failed to parse value " + inspect(value));
      this.formatsStateModel.setFormatsActive(false);
      this.updateValueDirectly(value);
    }
    else {
      this.formatsStateModel.setFormatsActive(true);
      var formattedParsedValue = parsedValue.toString();
      this.ruleModel.setPropertyValue(this, value);
      var updatedValue = this.value.get();
      var reformattedValue = formatsController.resetUpdatedValue(updatedValue, parsedValue, this.formatsStateModel);
      this.value.set(reformattedValue);
      this.changed.set(updatedValue != this.originalValue);
    }
  }, 
  
  resetValue: function() {
    this.updateValue(this.originalValue);
  }, 
  
  getExtraEditorModel: function() {
    if (this.type) {
      return this.type.getEditorModel();
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
  this.selector = new Observable("");
  this.name = new Observable("");
  this.value = new Observable("");
  this.changed = new Observable(false);
  this.errorMessage = new Observable(null);
  this.extraEditorModel = new Observable(null);
  this.formatsStateModel = new FormatsStateModel();
  var $this = this;
  this.formatsStateModel.selectedFormat.onChange(function(selectedFormat) {
    var value = $this.formatsStateModel.value;
    if (value.format != selectedFormat) {
      var newValue = value.convertToFormat(selectedFormat);
      if(!newValue) {
        throw new Error("Failed to convert " + value + " to format " + inspect(selectedFormat));
      }
      $this.saveValue(newValue.toString(), false);
    }
  });
}

ValueEditorModel.prototype = {
  clearErrorMessage: function() {
    this.errorMessage.set(null);
  }, 
  
  clear: function() {
    this.selector.set(null);
    this.name.set(null);
    this.value.set(null);
    this.changed.set(false);
    this.errorMessage.set(null);
  }, 
  
  editProperty: function(propertyModel) {
    this.clear();
    this.propertyModel.set(propertyModel);
    this.selector.set(propertyModel.ruleModel.rule.selectorText);
    this.name.set(propertyModel.name);
    this.value.set(propertyModel.value.get());
    this.changed.set(propertyModel.changed.get());
    this.setExtraEditorModelFor(propertyModel);
    propertyModel.setFormatsStateModel(this.formatsStateModel, this.value.get());
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
    if (extraEditorModel) {
      extraEditorModel.focus();
    }
  },
  
  handleSaveError: function(error) {
    this.formatsStateModel.enabled.set(false);
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
    var tabDiv = $("<div class='tab'/>").attr("id", id).append(view.dom).appendTo(this.tabsDom);
  }, 
  toggle: function() {
    var isOpen = this.dom.dialog("isOpen");
    this.dom.dialog (isOpen ? "close" : "open");
  }
};

function HelpView() {
  this.dom = $("<div class='help'/>");
  var $this = this;
  this.dom.load("lib/help.html", function() {
    listPropertyTypesInHtmlTable($this.dom.find("#property-editors-list"));
  });
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
  this.selectorDom = $("<div class='selector'/>").appendTo(this.dom);
  this.valueRowDom = $("<div class='value-row'/>").appendTo(this.dom);
  this.nameDom = $("<span class='name'/>");
  this.valueField = $("<input type='text' size='40'>");
  this.saveButton = $("<button/>").text("Save");
  this.saveButton.prop("disabled", true);
  this.resetButton = $("<button/>").text("Reset");
  this.formatsStateView = new FormatsView(valueEditorModel.formatsStateModel);
  this.valueRowDom.append(this.nameDom, " ", this.valueField, this.saveButton, this.resetButton, " ", 
                          this.formatsStateView.dom);
  this.errorMessageDom = $("<div class='error-message'/>").appendTo(this.dom);
  this.errorMessageDom.hide();
  this.extraEditorDom = $("<div class='extra-editor'/>").appendTo(this.dom);
  this.propertyModel = null;
  this.extraEditorView = null;
  var $this = this;
  var valueEditorModel = this.valueEditorModel;
  this.saveButton.on("click", function(event, ui) {
    $this.saveValue();
    $this.valueField.focus();
  });
  this.resetButton.on("click", function(event, ui) {
    valueEditorModel.resetValue();
    $this.valueField.focus();
  });
  this.valueField.on("keypress", function(event, ui) {
    if (event.which == 13) {
      $this.saveValue();
    }
  });
  this.valueField.on("input", function(event, ui) {
    $this.saveButton.prop("disabled", false);
  });
  this.valueEditorModel.selector.nowAndOnChange(function(selector) {
    $this.selectorDom.text(selector);
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

/** ===== Slider control =============================================== */
function SliderControlModel() {
  this.editorModel = new Observable(null);
  this.label = new Observable(null);
  this.value = new Observable(null);
  this.range = new Observable(null);
}

SliderControlModel.prototype = {
  unfocusCurrentEditorModel: function () {
    var previousEditorModel = this.editorModel.get();
    if(previousEditorModel) {
      previousEditorModel.focussed.set(false);
    }
  }, 
  setEditorModel: function(editorModel) {
    this.unfocusCurrentEditorModel();
    this.label.set(editorModel.description);
    this.value.set(editorModel.valueString);
    this.range.set(editorModel.range.get());
    this.editorModel.set(editorModel);
    editorModel.focussed.set(true);
  }, 
  updateValue: function(value) {
    this.value.set(value);
  }, 
  reset: function() {
    this.unfocusCurrentEditorModel();
    this.editorModel.set(null);
    this.label.set(null);
    this.value.set(null);
    this.range.set(null);
  }, 
  zoomIn: function() {
    var editorModel = this.editorModel.get();
    if (this.editorModel) {
      this.editorModel.get().zoomIn();
    }
  }, 
  zoomOut: function() {
    var editorModel = this.editorModel.get();
    if (this.editorModel) {
      this.editorModel.get().zoomOut();
    }
  }, 
  resetZoom: function() {
    var editorModel = this.editorModel.get();
    if (this.editorModel) {
      this.editorModel.get().resetZoom();
    }
  }
};

function SliderControlView(sliderControlModel) {
  this.sliderControlModel = sliderControlModel;
  sliderControlModel.view = this;
  this.dom = $("<div class='slider-control'/>");
  this.labelDom = $("<div class='label'/>");
  this.valueDom = $("<span/>");
  var valueWrapperDom = $("<div class='value'/>").append(this.valueDom);
  this.rangeDom = $("<div class='range'/>");
  var valueAndRangeDom = $("<div class='value-and-range'>").appendTo(this.dom);
  valueAndRangeDom.append(this.labelDom, " ", valueWrapperDom, " ", this.rangeDom);
  var $this = this;
  this.sliderControlModel.label.onChange(function(label) {
    $this.labelDom.text(label == null ? "" : (label + ":"));
  });
  this.sliderControlModel.value.onChange(function(value) {
    $this.valueDom.text(value == null ? "" : value);
  });
  this.sliderControlModel.range.onChange(function(range) {
    if (range == null) {
      $this.rangeDom.text("");
    }
    else {
      $this.rangeDom.text("(step: " + range.stepString + range.unit + ")");
    }
  });
  this.sliderControlModel.editorModel.nowAndOnChange(function(editorModel) {
    $this.dom.toggle(editorModel != null);
  });
  var zoomControlsDom = $("<div class='zoom-controls'>").appendTo(this.dom);
  this.zoomLabelDom = $("<div class='zoom-label'/>").text("Zoom:");
  this.zoomInButton = $("<button>In</button>");
  this.zoomOutButton = $("<button>Out</button>");
  this.resetZoomButton = $("<button>Reset</button>");
  zoomControlsDom.append(this.zoomLabelDom, " ", 
                         this.zoomInButton, " ", this.zoomOutButton, " ", this.resetZoomButton);
  this.zoomInButton.click(function() {
    $this.sliderControlModel.zoomIn();
  });
  this.zoomOutButton.click(function() {
    $this.sliderControlModel.zoomOut();
  });
  this.resetZoomButton.click(function() {
    $this.sliderControlModel.resetZoom();
  });
}

/** Assuming step is a decimal fraction with only one non-zero digit which is 1 or 2 or 5, and no < 0.001 */
function precisionForStepSize(step) {
  var n = Math.round(step*1000);
  if (n >= 1000) {
    return 0;
  }
  else if (n >= 100) {
    return 1;
  }
  else if (n >= 10) {
    return 2;
  }
  else {
    return 3;
  }
}

function Range(lower, upper, step, unit) {
  this.lower = lower;
  this.upper = upper;
  this.step = step;
  this.unit = unit;
  this.precision = precisionForStepSize(step);
  this.stepsPerUnit = Math.round(1.0/step);
  this.size = upper-lower;
  this.lowerString = lower.toFixed(this.precision);
  this.upperString = upper.toFixed(this.precision);
  this.stepString = step.toFixed(this.precision);
}

Range.prototype = {
  round: function(value) {
    return Math.round(value * this.stepsPerUnit) * this.step;
  }, 
  /** Return value as a fixed decimal string */
  valueAtPosition: function(position) { // position 0 => lower, position 1 => upper
    return this.round(this.lower + this.size * position).toFixed(this.precision);
  }, 
  positionForValue: function(value) {
    return (value-this.lower)/this.size;
  }, 
  toString: function() {
    return "Range[" + this.lowerString + "-" + this.upperString + 
      " (size = " + this.size + "), step " + this.stepString + "]";
  }
};

function RegexValueFormat(regex, matchLabels, beforeTexts, afterText) {
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
  this.afterText = afterText || "";
}

RegexValueFormat.prototype = {
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
        var value = values[matchLabel];
        if (value) {
          var beforeText = this.beforeTexts[matchLabel];
          if (beforeText) {
            parts.push(beforeText);
          }
          parts.push(values[matchLabel]);
        }
      }
    }
    parts.push(this.afterText);
    return parts.join("");
  }
};

function ObjectParserAndBuilder(objectParser) {
  this.objectParser = objectParser;
  this.parsedLabels = [];
  this.parsedValue = null;
}

ObjectParserAndBuilder.prototype = {
  getFormattedComponentValue: function(label) {
    return this.objectParser.formatComponent(label, this.parsedValue[label]);
  }, 
  parseValue: function(value) {
    this.parsedValue = this.objectParser.parse(value);
    this.parsedLabels = this.parsedValue ? this.parsedValue.labels : [];
  }, 
  updateValue: function(label, value) {
    this.parsedValue[label] = this.objectParser.parseComponent(label, value);
  },
  buildValue: function() {
    return this.parsedValue.toString();
  }
};


function ValueFormatsParserAndBuilder(valueFormats) {
  this.valueFormats = valueFormats;
  this.matchedValueFormat = null;
  this.parsedLabels = [];
  this.parsedValue = null;
}

ValueFormatsParserAndBuilder.prototype = {
  getFormattedComponentValue: function(label) {
    return this.parsedValue[label];
  }, 
  parseValue: function(value) {
    this.parsedValue = null;
    this.matchedValueFormat = null;
    this.parsedLabels = [];
    for (var i=0; i<this.valueFormats.length && this.parsedValue == null; i++) {
      var valueFormat = this.valueFormats[i];
      this.parsedValue = valueFormat.parseValue(value);
      if (this.parsedValue != null) {
        this.matchedValueFormat = valueFormat;
        var parserLabels = valueFormat.labels;
        this.parsedLabels = [];
        for (var i=0; i<parserLabels.length; i++) {
          var parserLabel = parserLabels[i];
          if (this.parsedValue[parserLabel]) {
            this.parsedLabels.push(parserLabel);
          }
        }
      }
    }
  }, 
  updateValue: function(label, value) {
    this.parsedValue[label] = value;
  }, 
  buildValue: function() {
    if (this.matchedValueFormat == null) {
      return null;
    }
    else {
      return this.matchedValueFormat.buildValue(this.parsedValue);
    }
  }
}

function ComponentsEditorModel(valueParserAndBuilder, labels, editorModels, additionalControlModels) {
  this.view = null;
  this.valueParserAndBuilder = valueParserAndBuilder;
  this.labels = labels;
  this.firstEditorModel = null;
  this.editorModels = editorModels;
  this.updateValueHandler = null;
  this.parsedLabels = new Observable([]);
  for (var i=0; i<labels.length; i++) {
    var label = labels[i];
    var editorModel = editorModels[label];
    editorModel.label = label;
    this.handleValueUpdateFrom(label, editorModel);
  }
  this.additionalControlModels = additionalControlModels;
}

ComponentsEditorModel.prototype = {
  onUpdateValue: function(handler) {
    this.updateValueHandler = handler;
  }, 
  setValueString: function(valueString) {
    this.valueParserAndBuilder.parseValue(valueString);
    var parsedLabels = this.valueParserAndBuilder.parsedLabels;
    this.parsedLabels.set(parsedLabels);
    this.firstEditorModel = null;
    for (var i=0; i<parsedLabels.length; i++) {
      var label = parsedLabels[i];
      var editorModel = this.editorModels[label];
      if (editorModel) {
        if (i == 0) {
          this.firstEditorModel = editorModel;
        }
        editorModel.setValueString(this.valueParserAndBuilder.getFormattedComponentValue(label));
        editorModel.setDescription(parsedLabels);
      }
    }
    this.resetAdditionalControl();
    if (this.firstEditorModel) {
      this.firstEditorModel.setAsFocussedModel();
    }
  }, 
  
  focus: function() {
    if (this.firstEditorModel) {
      this.firstEditorModel.focus();
    }
  }, 
  
  resetAdditionalControl: function() {
    for (var i=0; i<this.additionalControlModels.length; i++) {
      this.additionalControlModels[i].reset();
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
  var additionalControlModels = componentsEditorModel.additionalControlModels;
  for (var i=0; i<additionalControlModels.length; i++) {
    var additionalControlModel = additionalControlModels[i];
    this.dom.append(additionalControlModel.view.dom);
  }
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

function SizeEditorModel(negativeAllowed, sliderControlModel) {
  this.negativeAllowed = negativeAllowed;
  this.sliderControlModel = sliderControlModel;
  this.initialise();
}

SizeEditorModel.prototype = {
  initialise: function() {
    this.view = null; // The view should set this
    this.range = new Observable(null);
    this.updateValueHandler = null;
    this.description = null;
    this.shortDescription = new Observable(null);
    this.focussed = new Observable(false);
  }, 
  
  onUpdateValue: function(handler) {
    this.updateValueHandler = handler;
  }, 
  
  zoomIn: function() {
    this.zoomByFactor(2.0);
    $(this).trigger("zoomEdited");
  },
  
  zoomOut: function() {
    this.zoomByFactor(0.5);
    $(this).trigger("zoomEdited");
  }, 
  
  resetZoom: function() {
    this.resetRange();
    $(this).trigger("zoomEdited");
  },
  
  setAsFocussedModel: function() {
    this.sliderControlModel.setEditorModel(this);
  },    
  
  focus: function() {
    this.setAsFocussedModel();
    $(this).trigger("modelFocus");
  }, 
  
  setDescription: function(parsedLabels) {
    var descriptions = this.getDescriptionsShortAndLong(parsedLabels);
    this.shortDescription.set(descriptions[0]);
    this.description = descriptions[1];
  }, 
  
  updateValue: function(value) {
    this.valueString = value;
    this.sliderControlModel.updateValue(value);
    if (this.updateValueHandler != null) {
      this.updateValueHandler(value);
    }
  }, 
  
  zoomByFactor: function(zoomFactor) {
    var rangesForUnit = this.getRangesForUnit();
    this.range.set(rangesForUnit.getZoomedRange(this.size, this.negativeAllowed, 
                                                this.range.get(), zoomFactor));
  },
  
  resetRange: function() {
    var rangesForUnit = this.getRangesForUnit();
    this.range.set(rangesForUnit.getRange(this.size, this.negativeAllowed));
  }, 

  setSizeFromPosition: function(position) {
    var numberString = this.range.get().valueAtPosition(position);
    this.size = parseFloat(numberString);
    this.updateValue(numberString + this.unit);
  }, 
  
  setValueString: function(valueString) {
    this.valueString = valueString;
    var match = this.sizeRegex.exec(valueString);
    if (match) {
      this.size = parseFloat(match[1]);
      this.unit = match.length >= 3 ? match[2] : "";
      this.resetRange();
    }
    else {
      throw new Error("setValueString fails to match on string " + valueString);
    }
  }
  
};

function CssSizeEditorModel(negativeAllowed, sliderControlModel) {
  SizeEditorModel.call(this, negativeAllowed, sliderControlModel);
}

CssSizeEditorModel.prototype = $.extend({}, SizeEditorModel.prototype, {

  sizeRegex: /^([-]?[0-9.]+)(%|in|cm|mm|px|pt|em|ex|rem|pc)$/, 
  
  getRangesForUnit: function() {
    return cssUnitRanges[this.unit];
  }, 
  
  getDescriptionsShortAndLong: function(parsedLabels) {
    var numSizes = parsedLabels.length;
    if (this.label == "top") {
      return numSizes == 1 ? [null, "All"] : (numSizes == 2 ? ["T/B", "Top/Bottom"] : ["T", "Top"]);
    }
    else if (this.label == "right") {
      return numSizes < 4 ? ["R/L", "Right/Left"] : ["R", "Right"];
    }
    else if (this.label == "bottom") {
      return ["B", "Bottom"];
    }
    else if (this.label == "left") {
      return ["L", "Left"];
    }
    else {
      return [null, null];
    }
  }
  
});

function ColorComponentEditorModel(sliderControlModel) {
  SizeEditorModel.call(this, false, sliderControlModel);
}

ColorComponentEditorModel.prototype = $.extend({}, SizeEditorModel.prototype, {

  sizeRegex: /^([-]?[0-9.]+)$/, 
  
  colorComponentDescriptions: {red: ["R", "Red"], green: ["G", "Green"], blue: ["B", "Blue"]}, 
  
  getRangesForUnit: function() {
    return colorRange;
  }, 
  
  getDescriptionsShortAndLong: function(parsedLabels) {
      return this.colorComponentDescriptions[this.label];
  }
      
});

function HueComponentEditorModel(sliderControlModel) {
  SizeEditorModel.call(this, false, sliderControlModel);
}

HueComponentEditorModel.prototype = $.extend({}, SizeEditorModel.prototype, {

  sizeRegex: /^([0-9.]+)$/, 
  
  getRangesForUnit: function() {
    return hueRange;
  }, 
  
  getDescriptionsShortAndLong: function(parsedLabels) {
    return ["H", "Hue"];
  }
      
});

function PercentageComponentEditorModel(sliderControlModel, descriptions) {
  SizeEditorModel.call(this, false, sliderControlModel);
  this.descriptions = descriptions;
}

PercentageComponentEditorModel.prototype = $.extend({}, SizeEditorModel.prototype, {

  sizeRegex: /^([0-9.]+)(%)$/, 
  
  getRangesForUnit: function() {
    return percentageRange;
  }, 
  
  getDescriptionsShortAndLong: function(parsedLabels) {
    return this.descriptions;
  }
      
});

function AlphaComponentEditorModel(sliderControlModel) {
  SizeEditorModel.call(this, false, sliderControlModel);
}

AlphaComponentEditorModel.prototype = $.extend({}, SizeEditorModel.prototype, {

  sizeRegex: /^([0-9.]+)$/, 
  
  getRangesForUnit: function() {
    return alphaRange;
  }, 
  
  getDescriptionsShortAndLong: function(parsedLabels) {
    return ["A", "Alpha"];
  }
      
});

function FormatsStateModel() {
  this.formats = new Observable(null);
  this.selectedFormat = new Observable(null);
  this.formatsEnabled = new Observable(null);
  this.enabled = new Observable(false);
  this.formatsController = null;
  this.value = null;
}

FormatsStateModel.prototype = {
  changeFormat: function(value) {
    this.formatsController.changeFormat(value);
  }, 
  
  setFormatsController: function(formatsController, initialValue) {
    this.formatsController = formatsController;
    if (formatsController == null) {
      this.setFormatsActive(false);
    }
    else {
      formatsController.setInitialValue(initialValue, this);
    }
  }, 
  
  setFormatsActive: function(active) {
    this.formats.set(active && this.formatsController ? this.formatsController.formats : null);
  }
};

function ColorFormatsController() {
  this.formats = ["name", "rgb", "rgba", "hsl", "hsla", "hex"];
}

ColorFormatsController.prototype = {
  colorParser: new ColorParser(), 
  
  parseValue: function(value) {
    return this.colorParser.parse(value);
  }, 
  
  resetUpdatedValue: function(updatedValueString, parsedInputValue, formatsStateModel) {
    var parsedUpdatedValue = this.parseValue(updatedValueString);
    if (parsedUpdatedValue == null) {
      console.log("resetUpdatedValue, failed to reparse " + inspect(updatedValueString));
      return updatedValueString; // can't change, so return as is
    }
    else {
      var newValue = parsedUpdatedValue;
      if (parsedUpdatedValue.format != parsedInputValue.format) {
        var reconstructibleFormats = parsedUpdatedValue.reconstructibleFormats();
        if ($.inArray(parsedInputValue.format, reconstructibleFormats) != -1) {
          newValue = parsedUpdatedValue.convertToFormat(parsedInputValue.format);
          //console.log(" newValue from conversion to " + parsedInputValue.format + " = " + newValue);
        }
        else {
          var testNewValue = parsedUpdatedValue.convertToFormat(parsedInputValue.format);
          if (testNewValue) {
            //console.log("Input format " + parsedInputValue.format + ", updated format " + parsedUpdatedValue.format);
            //console.log("                        input value = " + parsedInputValue);
            //console.log("Reconstuction                        = " + testNewValue);
            //console.log("");
          }
          newValue = parsedInputValue;
        }
      }
      this.valueChanged(newValue, formatsStateModel);
      return newValue.toString();
    }
  }, 
  
  setInitialValue: function(valueString, formatsStateModel) {
    var value = this.parseValue(valueString);
    formatsStateModel.setFormatsActive(value != null);
    if (value) {
      this.valueChanged(value, formatsStateModel);
    }
  }, 
  
  valueChanged: function(value, formatsStateModel) {
    var formatsEnabled = {};
    var formats = value.enabledFormats();
    for (var i=0; i<formats.length; i++) {
      formatsEnabled[formats[i]] = true;
    }
    formatsStateModel.formatsEnabled.set(formatsEnabled);
    formatsStateModel.enabled.set(true);
    formatsStateModel.value = value;
    formatsStateModel.selectedFormat.set(value.format);
  }
};

function FormatsView(formatsStateModel) {
  this.formatsStateModel = formatsStateModel;
  this.dom = $("<select class='formats'/>");
  this.formatsModel = null;
  var $this = this;
  formatsStateModel.formats.nowAndOnChange(function (formats) {
    $this.dom.toggle(formats != null);
    if (formats != null) {
      $this.setOptions(formats);
      var selectedFormat = formatsStateModel.selectedFormat.get();
      $this.dom.find("option").each(function() {
        this.selected = (this.value == selectedFormat);
      });
    }
  });
  formatsStateModel.selectedFormat.nowAndOnChange(function(selectedFormat) {
    $this.dom.find("option").each(function() {
      this.selected = (this.value == selectedFormat);
    });
  });
  formatsStateModel.formatsEnabled.nowAndOnChange(function(formatsEnabled) {
    $this.dom.find("option").each(function() {
      this.disabled = !formatsEnabled[this.value];
    });
  });
  formatsStateModel.enabled.nowAndOnChange(function(enabled) {
    $this.dom.prop("disabled", !enabled);
  });
  this.dom.change(function(event, ui) {
    formatsStateModel.selectedFormat.set($(this).val());
  });
}

FormatsView.prototype = {
  setFormatsModel: function(formatsModel) {
    this.formatsModel = formatsModel;
  }, 
    
  setOptions: function(formats) {
    this.dom.empty();
    for (var i=0; i<formats.length; i++) {
      var format = formats[i];
      this.dom.append($("<option/>").attr("value", format).text(format));
    }
  }
};

function SizeEditorView(sizeEditorModel) {
  this.sizeEditorModel = sizeEditorModel;
  sizeEditorModel.view = this;
  this.dom = $("<div class='size-slider'/>");
  var shortDescriptionWrapperDom = $("<span/>");
  this.shortDescriptionDom = $("<div class='short-description'/>").appendTo(shortDescriptionWrapperDom);;
  this.lowerValueDom = $("<span class='value limit-value'/>");
  this.sliderDom = $("<div class='scale-slider'/>");
  this.upperValueDom = $("<span class='value limit-value'/>");
  this.unitDom = $("<span class='unit'/>");
  this.dom.append(shortDescriptionWrapperDom, this.lowerValueDom, " ", this.sliderDom, 
                  this.upperValueDom, " ", this.unitDom);
  this.ignoreValueChanges = false;
  var $this = this;
  
  function sliderChanged(event, ui) {
    if (!$this.ignoreValueChanges) {
      var position = ui.value / 100.0;
      sizeEditorModel.setSizeFromPosition(position);
    }
  };
  this.sliderDom.slider({min: 0, max: 100, slide: sliderChanged, change: sliderChanged});
  this.sliderDom.focusin(function() {
    $this.sizeEditorModel.setAsFocussedModel();
  });
  
  this.sizeEditorModel.focussed.nowAndOnChange(function (focussed) {
    $this.dom.toggleClass("focussed", focussed);
  });
  
  this.sizeEditorModel.shortDescription.nowAndOnChange(function(shortdescription) {
    shortDescriptionWrapperDom.toggle(shortdescription != null);
    $this.shortDescriptionDom.text(shortdescription == null ? "" : shortdescription);
  });
  
  this.sizeEditorModel.range.onChange(function(range) {
    $this.lowerValueDom.text(range.lowerString);
    $this.upperValueDom.text(range.upperString);
    $this.ignoreValueChanges = true;
    var newPosition = range.positionForValue(sizeEditorModel.size);
    $this.sliderDom.slider("option", "value", 100 * newPosition);
    $this.unitDom.text(range.unit);
    $this.ignoreValueChanges = false;
  });
  
  $(this.sizeEditorModel).on("zoomEdited", function() {
    $this.focusOnSlider();
  });
  
  $(this.sizeEditorModel).on("modelFocus", function() {
    $this.focusOnSlider();
  });
  
}

SizeEditorView.prototype = {
  focusOnSlider: function() {
    this.sliderDom.find(".ui-slider-handle").focus();
  }
};

function CssType(editorModel, denormaliser, formatsController, description) {
  denormaliser = denormaliser || null;
  this.denormaliser = denormaliser;
  this.formatsController = formatsController;
  this.editorModel = editorModel;
  this.description = description;
}

CssType.prototype = {
  getEditorModel: function() {
    return this.editorModel;
  }
};

/** ===== Range settings ==================================================== */

function RangesForUnit(unit, minCentreValue, minRange, maxValue, sizesAndSteps) {
  this.unit = unit;
  this.minCentreValue = minCentreValue;
  this.minRange = minRange;
  this.maxValue = maxValue;
  this.sizesAndSteps = sizesAndSteps;
}

RangesForUnit.prototype = {
  roundToStep: function(value, step) {
    return Math.round(value/step) * step;
  }, 
  
  getZoomedRange: function(value, negativeAllowed, range, zoomFactor) {
    var zoomedSize = Math.max(this.minRange, range.size / zoomFactor);
    var minValue = negativeAllowed ? -this.maxValue : 0;
    var lowerLimit = Math.max(minValue, value - zoomedSize/2);
    var upperLimit = Math.min(this.maxValue, value + zoomedSize/2);
    lowerLimit = Math.max(minValue, upperLimit-zoomedSize);
    upperLimit = Math.min(this.maxValue, lowerLimit+zoomedSize);
    var stepSize = this.getStepSizeFor(Math.abs(value));
    return new Range(this.roundToStep(lowerLimit, stepSize), 
                     this.roundToStep(upperLimit, stepSize), 
                     stepSize, range.unit);
  }, 
  
  getStepSizeFor: function(absCentreValue) {
    for (var i=this.sizesAndSteps.length-1; i >= 0; i--) {
      var sizeAndStep = this.sizesAndSteps[i];
      if (i == 0 || absCentreValue >= sizeAndStep[0]) {
        return sizeAndStep[1];
      }
    }
  }, 
  
  getRange: function(value, negativeAllowed) {
    var absValue = Math.abs(value);
    var absCentreValue = Math.max(absValue, this.minCentreValue);
    var centreValue = value < 0 ? -absCentreValue : absCentreValue;
    var step = this.getStepSizeFor(absCentreValue);
    if (value < 0) {
      return new Range(centreValue*2, -centreValue, step, this.unit);
    }
    else if (negativeAllowed) {
      return new Range(-centreValue, 2*centreValue, step, this.unit);
    }
    else {
      return new Range(0, 2*centreValue, step, this.unit);
    }
  }
};

var cssUnitRanges = {
  "%": new RangesForUnit("%", 10, 10, 10000, [[0, 0.5], [50, 1]]), 
  "in": new RangesForUnit("in", 1, 1, 1000, [[0, 0.1]]), 
  "cm": new RangesForUnit("cm", 1, 1, 1000, [[0, 0.1]]), 
  "mm": new RangesForUnit("mm", 5, 5, 10000, [[0, 0.5], [50, 1]]), 
  "px": new RangesForUnit("px", 16, 16, 16000, [[0, 0.5], [30, 1]]), 
  "pt": new RangesForUnit("pt", 12, 12, 12000, [[0, 0.5], [30, 1]]), 
  "em": new RangesForUnit("em", 1, 1, 1000, [[0, 0.1]]), 
  "ex": new RangesForUnit("ex", 1, 1, 1000, [[0, 0.1]]), 
  "rem": new RangesForUnit("rem", 1, 1, 1000, [[0, 0.1]]), 
  "pc": new RangesForUnit("pc", 1, 1, 1000, [ [0, 1]])
};

var alphaRange = new RangesForUnit("", 0.1, 0.1, 1, [ [0, 0.01] ]);

alphaRange.getRange = function(value, negativeAllowed) {
  return new Range(0, 1.0, 0.01, "");
};

function BoundedNonNegativeIntegerRange(minRange, maxValue, unit) {
  this.unit = unit;
  this.minRange = minRange;
  this.negativeAllowed = false;
  this.minValue = 0;
  this.maxValue = maxValue;
}

BoundedNonNegativeIntegerRange.prototype = {
  getZoomedRange: function(value, negativeAllowed, range, zoomFactor) {
    var zoomedSize = Math.max(this.minRange, range.size / zoomFactor);
    var lowerLimit = Math.max(this.minValue, value - zoomedSize/2);
    var upperLimit = Math.min(this.maxValue, value + zoomedSize/2);
    lowerLimit = Math.max(this.minValue, upperLimit-zoomedSize);
    upperLimit = Math.min(this.maxValue, lowerLimit+zoomedSize);
    return new Range(Math.round(lowerLimit), Math.round(upperLimit), 1, "");
  }, 
  getRange: function(value, negativeAllowed) {
    return new Range(this.minValue, this.maxValue, 1, "");
  }
};

function ColorRange(minRange) {
  BoundedNonNegativeIntegerRange.call(this, minRange, 255, "");
}
ColorRange.prototype = $.extend({}, BoundedNonNegativeIntegerRange.prototype);

var colorRange = new ColorRange(10);

function HueRange(minRange) {
  BoundedNonNegativeIntegerRange.call(this, minRange, 360, "");
}
HueRange.prototype = $.extend({}, BoundedNonNegativeIntegerRange.prototype);

var hueRange = new HueRange(10);

function PercentageRange(minRange) {
  BoundedNonNegativeIntegerRange.call(this, minRange, 100, "%");
}
PercentageRange.prototype = $.extend({}, BoundedNonNegativeIntegerRange.prototype);

var percentageRange = new PercentageRange(10);


/** ===== Denormalisers ==================================================== */

function CssSizeDenormaliser(defaultUnit) {
  this.defaultUnit = defaultUnit;
}

CssSizeDenormaliser.prototype = {
  sizeRegex: /^([-]?[0-9.]+)([%a-z]*)$/, 
  
  denormalise: function(inputValue, normalisedValue) {
    var denormalised = normalisedValue;
    var inputMatch = inputValue.match(this.sizeRegex);
    if (inputMatch) {
      var inputUnit = inputMatch[2];
      if (normalisedValue == "0px" && inputUnit == "") {
        denormalised = "0" + this.defaultUnit;
      }
    }
    return denormalised;
  }
};

function FourCssSizesDenormaliser(defaultUnit) {
  this.defaultUnit = defaultUnit;
  this.sizeDenormaliser = new CssSizeDenormaliser(defaultUnit);
}

FourCssSizesDenormaliser.prototype = {
  denormalise: function(inputValue, normalisedValue) {
    var inputValues = trim(inputValue).split(" ");
    var normalisedValues = normalisedValue.split(" ");
    for (var i=0; i<normalisedValues.length; i++) {
      normalisedValues[i] = this.sizeDenormaliser.denormalise(inputValues[i], normalisedValues[i]);
    }
    while(normalisedValues.length < inputValues.length) {
      if (normalisedValues.length == 1) {
        normalisedValues.push(normalisedValues[0]);
      } else if (normalisedValues.length == 2) {
        normalisedValues.push(normalisedValues[0]);
      } else if (normalisedValues.length == 3) {
        normalisedValues.push(normalisedValues[1]);
      }
    }
    return normalisedValues.join(" ");
  }
}


/** ===== Specific model editors ==================================================== */

function cssSizeEditor(negativeAllowed, sliderControlModel) {
  var model = new CssSizeEditorModel(negativeAllowed, sliderControlModel);
  new SizeEditorView(model);
  return model;
}

/** ----------------------------------------------------------------------------- */
var cssSizePattern = "[-]?[0-9.]+(%|in|cm|mm|px|pt|em|ex|rem|pc)"

var oneCssSizePattern = "^(" + cssSizePattern + ")$"
var oneCssSizeFormat = 
  new RegexValueFormat(new RegExp(oneCssSizePattern), 
                       [null, 
                        "size", null], {size1: ""});

function cssSizeEditorModel(allowNegative) {
  var sliderControlModel = new SliderControlModel();
  var sliderControlView = new SliderControlView(sliderControlModel);
  var model = new ComponentsEditorModel(new ValueFormatsParserAndBuilder([oneCssSizeFormat]), 
                                        ["size"], 
                                        {size: cssSizeEditor(allowNegative, sliderControlModel)}, 
                                        [sliderControlModel])
  new ComponentsEditorView(model);
  return model;
};

function CssSizeType() {
  this.allowNegative = false;
  this.description = "Size";
  this.denormaliser = new CssSizeDenormaliser("px");
}

CssSizeType.prototype = {
  getEditorModel: function() {
    return cssSizeEditorModel(this.allowNegative);
  }    
};

function CssPositionType() {
  CssSizeType.call(this);
  this.allowNegative = true;
  this.description = "Position";
}

CssPositionType.prototype = CssSizeType.prototype;

/** ----------------------------------------------------------------------------- */
var fourCssSizesPattern = "^(" + cssSizePattern + ")" 
  + "(\\s+(" + cssSizePattern + ")|)"
  + "(\\s+(" + cssSizePattern + ")|)"
  + "(\\s+(" + cssSizePattern + ")|)$";

var fourCssSizesFormat = 
  new RegexValueFormat(new RegExp(fourCssSizesPattern), 
                       [null, 
                        "top", null, 
                        null, "right", null, 
                        null, "bottom", null, 
                        null, "left", null], 
                       {top: "", right: " ", bottom: " ", left: " "});

function fourCssSizesEditorModel(allowNegative) {
  var sliderControlModel = new SliderControlModel();
  var sliderControlView = new SliderControlView(sliderControlModel);
  var model = new ComponentsEditorModel(new ValueFormatsParserAndBuilder([fourCssSizesFormat]), 
                                        ["top", "right", "bottom", "left"], 
                                        {top: cssSizeEditor(allowNegative, sliderControlModel), 
                                         right: cssSizeEditor(allowNegative, sliderControlModel), 
                                         bottom: cssSizeEditor(allowNegative, sliderControlModel), 
                                         left: cssSizeEditor(allowNegative, sliderControlModel)}, 
                                       [sliderControlModel]);
  new ComponentsEditorView(model);
  return model;
}

function FourCssSizesType() {
  this.allowNegative = false;
  this.description = "Sizes for top/right/bottom/left";
  this.denormaliser = new FourCssSizesDenormaliser("px");
}

FourCssSizesType.prototype = {
  getEditorModel: function() {
    return fourCssSizesEditorModel(this.allowNegative);
  }    
};

function FourCssPositionsType() {
  FourCssSizesType.call(this, true);
  this.allowNegative = true;
  this.description = "Positions for top/right/bottom/left";
}
FourCssPositionsType.prototype = FourCssSizesType.prototype;

/** ----------------------------------------------------------------------------- */
function colorComponentEditor(sliderControlModel) {
  var model = new ColorComponentEditorModel(sliderControlModel);
  new SizeEditorView(model);
  return model;
}

function hueComponentEditor(sliderControlModel) {
  var model = new HueComponentEditorModel(sliderControlModel);
  new SizeEditorView(model);
  return model;
}

function percentageComponentEditor(sliderControlModel, descriptions) {
  var model = new PercentageComponentEditorModel(sliderControlModel, descriptions);
  new SizeEditorView(model);
  return model;
}

function alphaComponentEditor(sliderControlModel) {
  var model = new AlphaComponentEditorModel(sliderControlModel);
  new SizeEditorView(model);
  return model;
}

function colorEditorModel() {
  var sliderControlModel = new SliderControlModel();
  var sliderControlView = new SliderControlView(sliderControlModel);
  var model = new ComponentsEditorModel(new ObjectParserAndBuilder(new ColorParser()), 
                                        ["red", "green", "blue", "hue", "saturation", "lightness", "alpha"], 
                                        {red: colorComponentEditor(sliderControlModel), 
                                         green: colorComponentEditor(sliderControlModel), 
                                         blue: colorComponentEditor(sliderControlModel), 
                                         hue: hueComponentEditor(sliderControlModel), 
                                         saturation: percentageComponentEditor(sliderControlModel, ["S", "Saturation"]), 
                                         lightness: percentageComponentEditor(sliderControlModel, ["L", "Lightness"]), 
                                         alpha: alphaComponentEditor(sliderControlModel)
                                        }, 
                                        [sliderControlModel]);
  new ComponentsEditorView(model);
  return model;
}

function ColorType() {
  this.formatsController = new ColorFormatsController();
  this.description = "Color";
}

ColorType.prototype = {
  getEditorModel: function() {
    return colorEditorModel();
  }
};
  
/** ----------------------------------------------------------------------------- */
function addTopLeftBottomRightTypes(types, beforePart, afterPart, type) {
  var positions = ["top", "left", "bottom", "right"];
  for (var i=0; i<4; i++) {
    types[beforePart + positions[i] + afterPart] = type;
  }
}

function listPropertyTypesInHtmlTable(tbodySelector) {
  var propertyNames = propertyTypes.propertyNames();
  propertyNames.sort();
  for (var i=0; i<propertyNames.length; i++) {
    var name = propertyNames[i];
    var typeDescription = propertyTypes.getType(name).description;
    var tableRow = $("<tr/>").appendTo(tbodySelector);
    $("<td class='property'/>").text(name).appendTo(tableRow);
    $("<td class='type'/>").text(typeDescription).appendTo(tableRow);
  }
}

function PropertyTypes() {
  this.types = {};
  this.setType(new FourCssPositionsType(), 
               ["margin"]);
  this.setType(new FourCssSizesType(), 
               ["padding", "border-width"]);
  this.setType(new CssSizeType(), 
               ["font-size", "width", "min-width", "max-width"]);
  this.setType(new ColorType(), 
               ["color", "background-color", "border-color"]);
  this.setType(new CssSizeType(), 
               this.templatedTrbl(["padding-{trbl}", "border-{trbl}-width"]))
  this.setType(new CssPositionType(), 
               this.templatedTrbl(["margin-{trbl}"]))
}

PropertyTypes.prototype = {
  propertyNames: function() {
    var names = [];
    for (key in this.types) {
      names.push(key);
    }
    return names;
  }, 

  getType: function(property) {
    return this.types[property];
  }, 
  
  setType: function(type, properties) {
    for (var i=0; i<properties.length; i++) {
      this.types[properties[i]] = type;
    }
  }, 
  
  templated: function(templates, variable, values) {
    var results = [];
    for (var i=0; i<templates.length; i++) {
      var template = templates[i];
      for (var j=0; j<values.length; j++) {
        results.push(template.replace(variable, values[j]));
      }
    }
    return results;
  }, 
  
  templatedTrbl: function(templates) {
    return this.templated(templates, "{trbl}", ["top", "right", "bottom", "left"]);
  }
};
  
var propertyTypes = new PropertyTypes();


console.log("End style-adjuster.js");
