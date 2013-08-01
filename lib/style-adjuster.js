function StyleAdjusterModel(styleSheets) {
  this.styleSheets = styleSheets;
  this.styleSheetsList = [];
  for (var i=0; i<styleSheets.length; i++) {
    this.styleSheetsList.push(new StyleSheetModel(this, styleSheets[i]));
  }
  this.rulesFilterText = "";
  this.propertyBeingEdited = null;
}

StyleAdjusterModel.prototype = {
  deselect: function(selectorFunction) {
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
    this.propertyBeingEdited = null;
    this.propertyEditor = null;
    $(this).trigger("clearPropertyEditor");
  }, 
  
  editProperty: function(propertyModel) {
    if (propertyModel == this.propertyBeingEdited) {
      console.log("Already editing that property");
    }
    else {
      if (this.propertyBeingEdited != null) {
        $(this.propertyBeingEdited).trigger("beingEdited", [false]);
      }
      this.clearPropertyEditor();
      this.propertyBeingEdited = propertyModel;
      $(this.propertyBeingEdited).trigger("beingEdited", [true]);
      this.propertyEditor = propertyModel.getValueEditor();
      this.propertyEditor.editProperty(propertyModel);
      $(this).trigger("setPropertyEditor");
    }
  }
};

function StyleSheetModel(styleAdjusterModel, styleSheet) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.styleSheet = styleSheet;
  this.selected = true;
  this.populateRules();
}

StyleSheetModel.prototype = {
  replaceRule: function(index, cssText) {
    this.styleSheet.insertRule(cssText, index); // todo, check for successful update (revert if failed)
    this.styleSheet.deleteRule(index+1);
    return this.styleSheet.cssRules[index];
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
      if (ruleModel.changed) {
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
      if ((ruleModel.filtered || ruleModel.selected) && (ruleModel.expanded != expanded)) {
        ruleModel.toggleExpanded();
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
      if (ruleModel.selected) {
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
  this.filtered = true;
  this.selected = false;
  this.expanded = false;
  this.properties = null;
  this.changed = false;
}
  
RuleModel.prototype = {
  filterRule: function() {
    var filterText = this.styleAdjusterModel.rulesFilterText;
    var onlyShowSelected = this.styleAdjusterModel.onlyShowSelected;
    var matchesFilter = filterText == "" || this.rule.selectorText.indexOf(filterText) != -1;
    var filtered = matchesFilter && (onlyShowSelected ? this.selected : true);
    var filteredChanged = filtered != this.filtered;
    this.filtered = filtered;
    if (filteredChanged) {
      $(this).trigger("filteringChanged");
    }
  }, 
  
  getCssChangesText: function() {
    var changeLines = [this.rule.selectorText + " {"];
      for (var i=0; i<this.properties.length; i++) {
        var propertyModel = this.properties[i];
        if (propertyModel.changed) {
          changeLines.push("  " + propertyModel.name + ": " + propertyModel.value + ";");
        }
      }
    changeLines.push("}\n");
    return changeLines.join("\n");
  }, 
    
  updateChanged: function() {
    var changed = false;
    if (this.properties != null) {
      for (var i=0; i<this.properties.length; i++) {
        if (this.properties[i].changed) {
          changed = true;
        }
      }
    }
    if (changed != this.changed) {
      this.changed = changed;
      $(this).trigger("changedChanged");
    }
  }, 
  
  setSelected: function(selected) {
    var selectionChanged = this.selected != selected;
    this.selected = selected;
    if (!selected) {
      if (this.properties != null) {
        for (var i=0; i<this.properties.length; i++) {
          this.properties[i].setSelected(false);
        }
      }
    }
    if (selectionChanged) {
      this.filterRule();
      $(this).trigger("selectionChanged");
    }
  }, 
  
  toggleExpanded: function() {
    this.expanded = !this.expanded;
    if (this.expanded && this.properties == null) {
      this.createPropertyModels();
    }
    $(this).trigger("expansionChanged");
  }, 
  
  createPropertyModels: function() {
    var cssText = this.rule.cssText;
    console.log("createPropertyModels, cssText = " + cssText);
    this.properties = [];
    this.cssTextModel = new CssTextModel(cssText);
    if (this.cssTextModel.error == null) {
      var cssPropertyModels = this.cssTextModel.properties;
      var namesByValue = {};
      for (var i=0; i<cssPropertyModels.length; i++) {
        var cssPropertyModel = cssPropertyModels[i];
        if (cssPropertyModel.error == null) {
          this.properties.push(new PropertyModel(this, cssPropertyModel.name, cssPropertyModel.value));
        }
      }
    }
  }, 
  
  setPropertyValue: function(name, value) {
    var newCssText = this.cssTextModel.cssTextForUpdated(name, value);
    console.log("Replacing rule to set property " + name + " = " + value + ", newCssText = " + newCssText);
    this.rule = this.styleSheetModel.replaceRule(this.index, newCssText);
    console.log(" new rule.cssText = " + this.rule.cssText);
    this.cssTextModel = new CssTextModel(this.rule.cssText);
    if (this.cssTextModel.error) { // todo - prevent by not allowing "; " in property value
      throw new Error(this.cssTextModel.error);
    }
    var newCssPropertyModels = this.cssTextModel.properties;
    for (var i=0; i<this.properties.length; i++) {
      var propertyModel = this.properties[i];
      var newCssPropertyModel = this.cssTextModel.properties[i];
      if (propertyModel.name != newCssPropertyModel.name) {
        throw new Error("New property name " + newCssPropertyModel.name + " does not match old name " + propertyModel.name);
      }
      propertyModel.value = newCssPropertyModel.value;
    }
  }, 
  
  findPropertiesToEdit: function() {
    this.propertiesToEdit = [];
    if (this.properties != null) {
      for (var i=0; i<this.properties.length; i++) {
        var property = this.properties[i];
        if(property.selected) {
          this.propertiesToEdit.push(property);
        }
      }
    }
  }
}

function PropertyModel(ruleModel, name, value) {
  this.ruleModel = ruleModel;
  this.styleAdjusterModel = ruleModel.styleAdjusterModel;
  this.name = name;
  this.value = value;
  this.selected = false;
  this.changed = false;
  this.originalValue = this.value;
}

PropertyModel.prototype = {
  setSelected: function(selected) {
    var selectionChanged = this.selected != selected;
    this.selected = selected;
    if (selected) {
      this.ruleModel.setSelected(true);
    }
    if (selectionChanged) {
      $(this).trigger("selectionChanged");
    }
  }, 
  
  editThisProperty: function() {
    this.styleAdjusterModel.editProperty(this);
    $(this).trigger("beingEdited", [true]);
  }, 
  
  updateValue: function(newValue) {
    this.ruleModel.setPropertyValue(this.name, newValue);
    this.value = newValue; // this.ruleModel.getPropertyValue(this.name);
    
    var changed = this.value != this.originalValue;
    if (changed != this.changed) {
      this.changed = changed;
      $(this).trigger("changedChanged");
      this.ruleModel.updateChanged();
    }
    $(this).trigger("valueChanged");
  }, 
  
  resetValue: function() {
    this.updateValue(this.originalValue);
  }, 
  
  getValueEditor: function() {
    return textValueEditor;
  }
}

function trim (str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
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
  var propertyTexts = propertiesText.split(";");
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

function indentCssText(cssText) {
  return new CssTextModel(cssText).toIndentedCssSource();
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
  this.dom.tabs({active: 0, activate: function(event, ui) {
    var tabId = ui.newPanel[0].id;
    console.log("Activate tab " + tabId);
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
  this.updateFromModel();
  var $this = this;
  $(this.ruleModel).on("selectionChanged", function(event) {
    $this.updateFromModelSelection();
  });
  $(this.ruleModel).on("filteringChanged", function(event) {
    $this.updateFromModelFiltered();
  });
  $(this.ruleModel).on("expansionChanged", function(event) {
    $this.updateFromModelExpansion();
  });
  $(this.ruleModel).on("changedChanged", function(event) {
    $this.updateFromModelChanged();
  });
}

RuleView.prototype = {
  addSelectCheckBox: function(parentDom) {
    this.selectCheckbox = $("<input type='checkbox'/>").appendTo(parentDom);
    this.selectCheckbox.prop("checked", this.ruleModel.selected);
    var $this = this;
    this.selectCheckbox.on("change", function(event) {
      $this.ruleModel.setSelected(this.checked);
    });
    $(this.ruleModel).on("selectionChanged", function(event) {
      $this.updateFromModelSelection();
    });
  }, 
  
  addExpandButton: function() {
    this.expandButton = $("<button class='expand'>+</button>").appendTo(this.dom);
    var $this = this;
    this.expandButton.on("click", function(event) {
      $this.ruleModel.toggleExpanded();
    });
  }, 
  
  updateFromModel: function() {
    this.updateFromModelChanged();
    this.updateFromModelSelection();
    this.updateFromModelFiltered();
    this.updateFromModelExpansion();
  }, 
  
  updateFromModelChanged: function() {
    this.selectorTextDom.toggleClass("rule-value-changed", this.ruleModel.changed);
    this.selectCheckbox.prop("disabled", this.ruleModel.changed);
  }, 
    
  updateFromModelSelection: function() {
    this.selectCheckbox.prop("checked", this.ruleModel.selected);
    this.dom.toggle(this.ruleModel.filtered || this.ruleModel.selected);
  }, 
  
  updateFromModelFiltered: function() {
    this.dom.toggle(this.ruleModel.filtered || this.ruleModel.selected);
    this.dom.toggleClass("filtered", this.ruleModel.filtered);
  }, 
  
  updateFromModelExpansion: function() {
    this.expandButton.text(this.ruleModel.expanded ? "-" : "+");
    if(this.ruleModel.expanded && this.propertiesDom == null) {
      this.propertiesDom = $("<div class='properties'/>").appendTo(this.dom);
      var properties = this.ruleModel.properties;
      this.propertyViews = [];
      for (var i=0; i<properties.length; i++) {
        var property = properties[i];
        var propertyView = new PropertyView(this, property);
        this.propertyViews.push(propertyView);
        this.propertiesDom.append(propertyView.dom);
      }
    }
    if (this.propertiesDom != null) {
      this.propertiesDom.toggle(this.ruleModel.expanded);
    }
  }
};

function PropertyView(ruleView, propertyModel) {
  this.ruleView = ruleView;
  this.propertyModel = propertyModel;
  this.dom = $("<div class='property'/>");
  var labelDom = $("<label/>").appendTo(this.dom);
  this.addSelectCheckBox(labelDom);
  this.nameAndValueDom = $("<span class='name-and-value'/>");
  this.nameDom = $("<span class='name'/>").text(this.propertyModel.name);
  var separatorDom = $("<span class='separator'/>").text(": ");
  this.propertyValueView = new PropertyValueView(propertyModel);
  this.nameAndValueDom.append(this.nameDom, separatorDom, this.propertyValueView.dom);
  labelDom.append(this.nameAndValueDom);
  var $this = this;
  $(this.propertyModel).on("selectionChanged", function(event) {
    $this.updateFromModelSelection();
  });
  $(this.propertyModel).on("changedChanged", function(event) {
    $this.updateFromModelChanged();
  });
  
}

PropertyView.prototype = {
  addSelectCheckBox: function(parentDom) {
    this.selectCheckbox = $("<input type='checkbox'/>").appendTo(parentDom);
    this.selectCheckbox.prop("checked", this.propertyModel.selected);
    var $this = this;
    this.selectCheckbox.on("change", function(event) {
      $this.propertyModel.setSelected(this.checked);
    });
  }, 
  
  updateFromModelSelection: function() {
    this.selectCheckbox.prop("checked", this.propertyModel.selected);
  },
  
  updateFromModelChanged: function() {
    this.selectCheckbox.prop("disabled", this.propertyModel.changed);
  }    
};

function PropertyValueView(propertyModel) {
  this.propertyModel = propertyModel;
  this.dom = $("<span/>");
  this.valueDom = $("<span class='value'/>").text(this.propertyModel.value).appendTo(this.dom);
  this.originalValueDom = $("<span class='original-value'/>").appendTo(this.dom);
  var $this = this;
  this.updateFromValue();
  $(this.propertyModel).on("valueChanged", function(event) {
    $this.updateFromValue();
  });
};  

PropertyValueView.prototype = {
  updateFromValue: function() {
    this.valueDom.text(this.propertyModel.value);
    this.valueDom.toggleClass('changed-value', this.propertyModel.changed);
    this.originalValueDom.text(this.propertyModel.changed 
                                ? (" (original value = " + this.propertyModel.originalValue + ")") : "");
  }
};
  

function EditView(styleAdjusterModel) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.dom = $("<div class='edit'></div>");
  this.emptyMessageDom = $("<div class='empty-message'>").text("(No properties have been selected)").hide();
  this.dom.append(this.emptyMessageDom);
  this.editorWrapperDom = $("<div class='editor-wrapper'/>").appendTo(this.dom);
  this.propertiesWrapperDom = $("<div class='properties-wrapper'/>").appendTo(this.dom);
  var $this = this;
  $(styleAdjusterModel).on("clearPropertyEditor", function(event) {
    $this.clearPropertyEditor();
  });
  $(styleAdjusterModel).on("setPropertyEditor", function(event) {
    $this.setPropertyEditor();
  });
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
  clearPropertyEditor: function() {
    this.editorWrapperDom.children().detach();
  }, 
  setPropertyEditor: function() {
    this.editorWrapperDom.append(this.styleAdjusterModel.propertyEditor.dom);
    this.styleAdjusterModel.propertyEditor.initialiseFocus();
  }
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
  this.updateFromModelChanged();
  var $this = this;
  $(this.ruleModel).on("changedChanged", function(event) {
    $this.updateFromModelChanged();
  });
}

RuleEditView.prototype = {
  updateFromModelChanged: function() {
    this.selectorTextDom.toggleClass("rule-value-changed", this.ruleModel.changed);
  }
};

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
  $(this.propertyModel).on("beingEdited", function(event, beingEdited) {
    $this.dom.toggleClass("being-edited", beingEdited);
  });
}

function TextValueEditor() {
  this.dom = $("<div class='text-value-editor'/>");
  this.nameDom = $("<span class='name'/>");
  this.valueField = $("<input type='text'>");
  this.saveButton = $("<button/>").text("Save");
  this.saveButton.prop("disabled", true);
  this.resetButton = $("<button/>").text("Reset");
  this.dom.append(this.nameDom, " ", this.valueField, this.saveButton, this.resetButton);
  var $this = this;
  this.saveButton.on("click", function(event, ui) {
    $this.saveValue();
  });
  this.resetButton.on("click", function(event, ui) {
    $this.resetValue();
  });
  this.valueField.on("keypress", function(event, ui) {
    if (event.which == 13) {
      $this.saveValue();
    }
  });
  this.valueField.on("input", function(event, ui) {
    $this.saveButton.prop("disabled", false);
  });
}

TextValueEditor.prototype = {
  editProperty: function(propertyModel) {
    this.propertyModel = propertyModel;
    this.nameDom.text(this.propertyModel.name);
    this.valueField.val(this.propertyModel.value);
    this.updateResetButtonState();
  }, 
  
  saveValue: function() {
    var newValue = this.valueField.val();
    this.propertyModel.updateValue(newValue);
    this.saveButton.prop("disabled", true);
    this.updateResetButtonState();
  }, 
  
  resetValue: function() {
    this.propertyModel.resetValue();
    this.valueField.val(this.propertyModel.value);
    this.saveButton.prop("disabled", true);
    this.updateResetButtonState();
  }, 
  
  updateResetButtonState: function() {
    this.resetButton.prop("disabled", !this.propertyModel.changed);
  },    
  
  initialiseFocus: function() {
    this.valueField.focus();
  }
}

var textValueEditor = new TextValueEditor();

function selectElementContents(element) {
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

function ChangesView(styleAdjusterModel) {
  this.styleAdjusterModel = styleAdjusterModel;
  this.dom = $("<div class='changes'/>");
  this.selectButton = $("<button/>").text("Select").appendTo(this.dom);
  var $this = this;
  this.selectButton.on("click", function(event, ui) {
    selectElementContents($this.cssDom[0]);
  });
  this.cssDom = $("<pre/>").appendTo(this.dom);
}

ChangesView.prototype = {
  activate: function() {
    this.cssDom.empty();
    this.cssDom.text(this.styleAdjusterModel.getCssChangesText());
  }
};

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
