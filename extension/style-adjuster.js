/*======================================================================== */
/** These code contained with the ColorConverter class is adapted from
 
    https://github.com/harthur/color-convert/blob/master/conversions.js
     
Which had the following copyright notice & license:

Copyright (c) 2012 Heather Arthur

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
window.STYLE_ADJUSTER = window.STYLE_ADJUSTER || {};

(function(lib) {
  
  // imports from common
  var InvalidPropertyValueError = lib.InvalidPropertyValueError;
  var parseSingleCssPropertyRule = lib.parseSingleCssPropertyRule;
  var inspect = lib.inspect;
  var trim = lib.trim;
  
  var options = { helpHtmlUrl: "help.html"};

  function ColorConverter() {
    this.reverseKeywords = {};
    for (var key in this.cssKeywords) {
      this.reverseKeywords[JSON.stringify(this.cssKeywords[key])] = key;
    }
  }

  ColorConverter.prototype = {
    hsl2rgb: function (hsl) {
      var h = hsl[0] / 360,
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      t1, t2, t3, rgb, val;

      if (s == 0) {
        val = l * 255;
        return [val, val, val];
      }

      if (l < 0.5)
        t2 = l * (1 + s);
      else
        t2 = l + s - l * s;
      t1 = 2 * l - t2;

      rgb = [0, 0, 0];
      for (var i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * - (i - 1);
        t3 < 0 && t3++;
        t3 > 1 && t3--;

        if (6 * t3 < 1)
          val = t1 + (t2 - t1) * 6 * t3;
        else if (2 * t3 < 1)
          val = t2;
        else if (3 * t3 < 2)
          val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        else
          val = t1;

        rgb[i] = val * 255;
      }
      
      return rgb;
    }, 

    rgb2hsl: function (rgb) {
      var r = rgb[0]/255.0,
      g = rgb[1]/255.0,
      b = rgb[2]/255.0,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min;
      var h, s, l;

      if (max == min)
        h = 0;
      else if (r == max) 
        h = (g - b) / delta; 
      else if (g == max)
        h = 2 + (b - r) / delta; 
      else if (b == max)
        h = 4 + (r - g)/ delta;

      h = Math.min(h * 60, 360);

      if (h < 0)
        h += 360;

      l = (min + max) / 2;

      if (max == min)
        s = 0;
      else if (l <= 0.5)
        s = delta / (max + min);
      else
        s = delta / (2 - max - min);

      return [h, s * 100, l * 100];
    }, 
    
    rgbValuesForNamedColor: function(name) {
      return this.colorRgbValues[name];
    }, 

    colorRgbValues: {
      aliceblue:  [240,248,255],
      antiquewhite: [250,235,215],
      aqua: [0,255,255],
      aquamarine: [127,255,212],
      azure:  [240,255,255],
      beige:  [245,245,220],
      bisque: [255,228,196],
      black:  [0,0,0],
      blanchedalmond: [255,235,205],
      blue: [0,0,255],
      blueviolet: [138,43,226],
      brown:  [165,42,42],
      burlywood:  [222,184,135],
      cadetblue:  [95,158,160],
      chartreuse: [127,255,0],
      chocolate:  [210,105,30],
      coral:  [255,127,80],
      cornflowerblue: [100,149,237],
      cornsilk: [255,248,220],
      crimson:  [220,20,60],
      cyan: [0,255,255],
      darkblue: [0,0,139],
      darkcyan: [0,139,139],
      darkgoldenrod:  [184,134,11],
      darkgray: [169,169,169],
      darkgreen:  [0,100,0],
      darkgrey: [169,169,169],
      darkkhaki:  [189,183,107],
      darkmagenta:  [139,0,139],
      darkolivegreen: [85,107,47],
      darkorange: [255,140,0],
      darkorchid: [153,50,204],
      darkred:  [139,0,0],
      darksalmon: [233,150,122],
      darkseagreen: [143,188,143],
      darkslateblue:  [72,61,139],
      darkslategray:  [47,79,79],
      darkslategrey:  [47,79,79],
      darkturquoise:  [0,206,209],
      darkviolet: [148,0,211],
      deeppink: [255,20,147],
      deepskyblue:  [0,191,255],
      dimgray:  [105,105,105],
      dimgrey:  [105,105,105],
      dodgerblue: [30,144,255],
      firebrick:  [178,34,34],
      floralwhite:  [255,250,240],
      forestgreen:  [34,139,34],
      fuchsia:  [255,0,255],
      gainsboro:  [220,220,220],
      ghostwhite: [248,248,255],
      gold: [255,215,0],
      goldenrod:  [218,165,32],
      gray: [128,128,128],
      green:  [0,128,0],
      greenyellow:  [173,255,47],
      grey: [128,128,128],
      honeydew: [240,255,240],
      hotpink:  [255,105,180],
      indianred:  [205,92,92],
      indigo: [75,0,130],
      ivory:  [255,255,240],
      khaki:  [240,230,140],
      lavender: [230,230,250],
      lavenderblush:  [255,240,245],
      lawngreen:  [124,252,0],
      lemonchiffon: [255,250,205],
      lightblue:  [173,216,230],
      lightcoral: [240,128,128],
      lightcyan:  [224,255,255],
      lightgoldenrodyellow: [250,250,210],
      lightgray:  [211,211,211],
      lightgreen: [144,238,144],
      lightgrey:  [211,211,211],
      lightpink:  [255,182,193],
      lightsalmon:  [255,160,122],
      lightseagreen:  [32,178,170],
      lightskyblue: [135,206,250],
      lightslategray: [119,136,153],
      lightslategrey: [119,136,153],
      lightsteelblue: [176,196,222],
      lightyellow:  [255,255,224],
      lime: [0,255,0],
      limegreen:  [50,205,50],
      linen:  [250,240,230],
      magenta:  [255,0,255],
      maroon: [128,0,0],
      mediumaquamarine: [102,205,170],
      mediumblue: [0,0,205],
      mediumorchid: [186,85,211],
      mediumpurple: [147,112,219],
      mediumseagreen: [60,179,113],
      mediumslateblue:  [123,104,238],
      mediumspringgreen:  [0,250,154],
      mediumturquoise:  [72,209,204],
      mediumvioletred:  [199,21,133],
      midnightblue: [25,25,112],
      mintcream:  [245,255,250],
      mistyrose:  [255,228,225],
      moccasin: [255,228,181],
      navajowhite:  [255,222,173],
      navy: [0,0,128],
      oldlace:  [253,245,230],
      olive:  [128,128,0],
      olivedrab:  [107,142,35],
      orange: [255,165,0],
      orangered:  [255,69,0],
      orchid: [218,112,214],
      palegoldenrod:  [238,232,170],
      palegreen:  [152,251,152],
      paleturquoise:  [175,238,238],
      palevioletred:  [219,112,147],
      papayawhip: [255,239,213],
      peachpuff:  [255,218,185],
      peru: [205,133,63],
      pink: [255,192,203],
      plum: [221,160,221],
      powderblue: [176,224,230],
      purple: [128,0,128],
      red:  [255,0,0],
      rosybrown:  [188,143,143],
      royalblue:  [65,105,225],
      saddlebrown:  [139,69,19],
      salmon: [250,128,114],
      sandybrown: [244,164,96],
      seagreen: [46,139,87],
      seashell: [255,245,238],
      sienna: [160,82,45],
      silver: [192,192,192],
      skyblue:  [135,206,235],
      slateblue:  [106,90,205],
      slategray:  [112,128,144],
      slategrey:  [112,128,144],
      snow: [255,250,250],
      springgreen:  [0,255,127],
      steelblue:  [70,130,180],
      tan:  [210,180,140],
      teal: [0,128,128],
      thistle:  [216,191,216],
      tomato: [255,99,71],
      turquoise:  [64,224,208],
      violet: [238,130,238],
      wheat:  [245,222,179],
      white:  [255,255,255],
      whitesmoke: [245,245,245],
      yellow: [255,255,0],
      yellowgreen:  [154,205,50]
    }

  };

  /*======================================================================== */
  var colorConverter = new ColorConverter();

  function NamedColor(name) {
    this.name = name;
  }

  NamedColor.prototype = {
    format: "name", 
    
    labels: ["name"], 
    
    regex: /^[a-z]+$/, 
    
    parse: function(value) {
      if (value.match(NamedColor.prototype.regex)) {
        return new NamedColor(value);
      }
      else {
        return null;
      }
    }, 
    
    enabledFormats: function() {
      return ["name", "rgb", "rgba", "hex", "hsl", "hsla"];
    }, 
    
    reconstructibleFormats: function() {
      return ["name", "rgb", "rgba", "hex", "hsl", "hsla"];
    }, 
    
    convertToFormat: function(format) {
      if (format == "rgb" || format == "hex") {
        var rgbValues = colorConverter.rgbValuesForNamedColor(this.name);
        if (rgbValues) {
          return new RgbColor(rgbValues[0], rgbValues[1], rgbValues[2], format);
        }
      }
      else {
        return this.convertToFormat("rgb").convertToFormat(format);
      }
    }, 
    
    toString: function() {
      return this.name;
    }
  };

  function RgbColor(red, green, blue, format) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.format = format || "rgb";
  }

  RgbColor.prototype = {
    labels: ["red", "green", "blue"], 
    
    regex: /^rgb\(([0-9]+),\s*([0-9]+),\s*([0-9]+)\)$/, 

    hexRegex: /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/, 
    
    withComponentUpdated: function(label, value) {
      var clone = new RgbColor(this.red, this.green, this.blue, this.format);
      clone[label] = value;
      return clone;
    }, 
    
    parse: function (colorString) {
      var match = colorString.match(RgbColor.prototype.regex);
      if (match) {
        return new RgbColor(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), "rgb");
      }
      else {
        match = colorString.match(RgbColor.prototype.hexRegex);
        if (match) {
          return new RgbColor(parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16), "hex");
        }
        else {
          return null;
        }
      }
    }, 
    
    toString: function() {
      if (this.format == "hex") {
        return "#" + this.toHex(this.red) + this.toHex(this.green) + this.toHex(this.blue);
      }
      else if (this.format == "rgb") {
        return "rgb(" + this.red + ", " + this.green + ", " + this.blue + ")";
      }
    }, 
    
    reconstructibleFormats: function() {
      return ["rgba", "rgb", "hex"];
    }, 
    
    enabledFormats: function() {
      return ["rgb", "rgba", "hex", "hsl", "hsla"];
    }, 
    
    convertToFormat: function(format) {
      if (format == "rgba") {
        return new RgbaColor(this.red, this.green, this.blue, 1.0);
      }
      else if (format == "rgb" || format == "hex") {
        return new RgbColor(this.red, this.green, this.blue, format);
      }
      else if (format == "hsl") {
        var hslValues = colorConverter.rgb2hsl([this.red, this.green, this.blue]);
        return new HslColor(Math.round(hslValues[0]), new Percentage(Math.round(hslValues[1])), 
                            new Percentage(Math.round(hslValues[2])));
      }
      else if (format == "hsla") {
        return this.convertToFormat("hsl").convertToFormat("hsla");
      }
    }, 

    toHex: function(n) {
      var hex = n.toString(16);
      if(hex.length == 1) {
        hex = "0" + hex;
      }
      return hex;
    }
    
  };

  function RgbaColor(red, green, blue, alpha) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
  }

  RgbaColor.prototype = {
    format: "rgba", 
    labels: ["red", "green", "blue", "alpha"], 
    regex: /^rgba\(([0-9]+),\s*([0-9]+),\s*([0-9]+),\s*([0-9.]+)\)$/, 
    
    withComponentUpdated: function(label, value) {
      var clone = new RgbaColor(this.red, this.green, this.blue, this.alpha);
      clone[label] = value;
      return clone;
    }, 
    
    parse: function (colorString) {
      var match = colorString.match(RgbaColor.prototype.regex);
      if (match) {
        return new RgbaColor(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseFloat(match[4]));
      }
      else {
        return null;
      }
    }, 

    reconstructibleFormats: function() {
      return ["rgba"];
    }, 
    
    enabledFormats: function() {
      return ["rgb", "rgba", "hex", "hsl", "hsla"];
    }, 

    convertToFormat: function(format) {
      if (format == "rgb" || format == "hex") {
        return new RgbColor(this.red, this.green, this.blue, format);
      }
      else if (format == "hsla") {
        var hslValues = colorConverter.rgb2hsl([this.red, this.green, this.blue]);
        return new HslaColor(Math.round(hslValues[0]), 
                             new Percentage(Math.round(hslValues[1])), 
                             new Percentage(Math.round(hslValues[2])), this.alpha);
      }
      else if (format = "hsl") {
        return this.convertToFormat("hsla").convertToFormat("hsl");
      }
    }, 

    toString: function() {
      return "rgba(" + this.red + ", " + this.green + ", " + this.blue + ", " + this.alpha + ")";
    }
  };

  function HslColor(hue, saturation, lightness) {
    this.hue = hue;
    this.saturation = saturation;
    this.lightness = lightness;
  }

  HslColor.prototype = {
    format: "hsl", 
    labels: ["hue", "saturation", "lightness"], 
    regex: /^hsl\(([0-9]+),\s*([0-9]+%),\s*([0-9]+%)\)$/, 
    
    withComponentUpdated: function(label, value) {
      var clone = new HslColor(this.hue, this.saturation, this.lightness);
      clone[label] = value;
      return clone;
    }, 
    
    parse: function (colorString) {
      var match = colorString.match(HslColor.prototype.regex);
      if (match) {
        return new HslColor(parseInt(match[1]), parsePercentage(match[2]), parsePercentage(match[3]));
      }
      else {
        return null;
      }
    }, 

    reconstructibleFormats: function() {
      return ["hsla", "hsl"];
    }, 
    
    enabledFormats: function() {
      return ["hsl", "hsla", "rgb", "hex", "rgba"];
    }, 

    convertToFormat: function(format) {
      if (format == "hsla") {
        return new HslaColor(this.hue, this.saturation, this.lightness, 1.0);
      }
      else if (format == "rgb" || format == "hex") {
        var rgbValues = colorConverter.hsl2rgb([this.hue, this.saturation.number, this.lightness.number]);
        return new RgbColor(Math.round(rgbValues[0]), Math.round(rgbValues[1]), Math.round(rgbValues[2]), format);
      }
      else if (format = "rgba") {
        return this.convertToFormat("rgb").convertToFormat("rgba");
      }
    }, 

    toString: function() {
      return "hsl(" + this.hue + ", " + this.saturation + ", " + this.lightness + ")";
    }
  };

  function HslaColor(hue, saturation, lightness, alpha) {
    this.hue = hue;
    this.saturation = saturation;
    this.lightness = lightness;
    this.alpha = alpha;
  }

  HslaColor.prototype = {
    format: "hsla", 
    labels: ["hue", "saturation", "lightness", "alpha"], 
    regex: /^hsla\(([0-9]+),\s*([0-9]+%),\s*([0-9]+%),\s*([0-9.]+)\)$/, 
    
    withComponentUpdated: function(label, value) {
      var clone = new HslaColor(this.hue, this.saturation, this.lightness, this.alpha);
      clone[label] = value;
      return clone;
    }, 
    
    parse: function (colorString) {
      var match = colorString.match(HslaColor.prototype.regex);
      if (match) {
        return new HslaColor(parseInt(match[1]), parsePercentage(match[2]), parsePercentage(match[3]), 
                             parseFloat(match[4]));
      }
      else {
        return null;
      }
    }, 

    reconstructibleFormats: function() {
      return ["hsla"];
    }, 
    
    enabledFormats: function() {
      return ["rgb", "rgba", "hex", "hsl", "hsla"];
    }, 

    convertToFormat: function(format) {
      if (format == "hsl") {
        return new HslColor(this.hue, this.saturation, this.lightness);
      }
      else if (format == "rgba") {
        var rgbValues = colorConverter.hsl2rgb([this.hue, this.saturation.number, this.lightness.number]);
        return new RgbaColor(Math.round(rgbValues[0]), Math.round(rgbValues[1]), Math.round(rgbValues[2]), this.alpha);
      }
      else if (format == "rgb" || format == "hex") {
        return this.convertToFormat("rgba").convertToFormat(format);
      }
    }, 

    toString: function() {
      return "hsla(" + this.hue + ", " + this.saturation + ", " + this.lightness + ", " + this.alpha + ")";
    }
  };

  var colorConverter = new ColorConverter();

  function Percentage(number) {
    this.number = number;
  }
  
  Percentage.prototype = {
    toString: function() {
      return this.number + "%";
    }
  };

  function parsePercentage(percentage) {
    var match = percentage.match(/^([0-9]+)%/);
    if(match) {
      return new Percentage(parseInt(match[1]));
    }
    else {
      throw new Error("Invalid percentage: " + inspect(percentage));
    }
  }

  var colorParser = {
    colorParsers: [NamedColor.prototype.parse, 
                   RgbColor.prototype.parse, 
                   RgbaColor.prototype.parse, 
                   HslColor.prototype.parse, 
                   HslaColor.prototype.parse], 
    
    parse: function(valueString) {
      var parsedColor = null;
      for (var i=0; i<this.colorParsers.length && parsedColor == null; i++) {
        parsedColor = this.colorParsers[i](valueString);
      }
      return parsedColor;
    }
  };

  /** ===== Utility Functions & Classes ========================================================================= */
  
  function withNonBreakingHyphens(text) {
    return text.replace(/-/g, "\u2011");
  }

  // merge any number of objects, creating a new object
  function merge() {
    var result = {};
    for (var i=0; i<arguments.length; i++ ) {
      var object = arguments[i];
      var name;
      for (name in object) {
	var value = object[ name ];
	if ( value !== undefined ) {
	  result[name] = value;
	}
      }
    }
    return result;
  };
  
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
  function RulePrechecker(testDocument) {
    this.testDocument = testDocument;
    this.styleSheet = this.getRulePrecheckerStyleSheet(testDocument);
    this.ruleIndex = this.styleSheet.cssRules.length;
    this.selector = ".precheck"; // a selector that's not actually on the page
  }
  
  RulePrechecker.prototype = {
    getRulePrecheckerStyleSheet: function(testDocument) {
      for (var i=0; i<testDocument.styleSheets.length; i++) {
        var styleSheet = testDocument.styleSheets[i];
        if (styleSheet.href.match(/rule-prechecker.css$/)) {
          return styleSheet;
        }
      }
      throw new Error("rule-prechecker.css styleSheet not found");
    }, 
    
    /** Test saving a property value, and return the normalised value
     or throw InvalidPropertyValueError if not valid */
    testSave: function(property, value) {
      if (value.indexOf(";") != -1) {
        throw new InvalidPropertyValueError(property, value, "Semi-colons not allowed in value");
      }
      var ruleText = this.selector + " { " + property + ":" + value + "; }";
      try {
        this.styleSheet.insertRule(ruleText, this.ruleIndex);
      }
      catch (error) {
        throw new InvalidPropertyValueError(property, value, error.message);
      }
      var newRule = this.styleSheet.cssRules[this.ruleIndex];
      var savedCssText = newRule.cssText;
      this.styleSheet.deleteRule(this.ruleIndex);
      var savedCss = parseSingleCssPropertyRule(savedCssText);
      if (savedCss == null) {
        throw new InvalidPropertyValueError(property, value, "Rejected by browser");
      }
      return savedCss.value;
    }
    
  };
  
  function StyleAdjusterModel(styleSheets) {
    this.styleSheets = styleSheets;
    this.rulePrechecker = null;
  }
  
  StyleAdjusterModel.prototype = {
    initialise: function(response) {
      $this = this;
      this.styleSheetObjects = this.styleSheets.getStyleSheetObjects({}, function(styleSheetObjects) {
        $this.initialiseFrom(styleSheetObjects);
        response();
      });
    }, 
    initialiseFrom: function(styleSheetObjects) {
      this.styleSheetsList = [];
      this.styleSheetObjects = styleSheetObjects;
      for (var i=0; i<this.styleSheetObjects.length; i++) {
        this.styleSheetsList.push(new StyleSheetModel($this, $this.styleSheetObjects[i]));
      }
      this.rulesFilterText = "";
      this.propertyBeingEdited = null;
      this.valueEditorModel = new ValueEditorModel();
    }, 
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

  function StyleSheetModel(styleAdjusterModel, styleSheet) {
    this.styleAdjusterModel = styleAdjusterModel;
    this.styleSheets = styleAdjusterModel.styleSheets;
    this.styleSheet = styleSheet;
    this.selected = true;
    this.accessError = false;
    this.populateRules();
  }

  StyleSheetModel.prototype = {
    updatePropertyValue: function(ruleIndex, name, value, expectedSavedValue) {
      this.styleSheets.updatePropertyValue({index: this.styleSheet.index, ruleIndex: ruleIndex, 
                                            name: name, value: value, expectedSavedValue: expectedSavedValue});
    }, 
    
    populateRules: function() {
      this.rulesList = [];
      var rules = this.styleSheet.rules;
      if (!rules) {
        this.accessError = true;
      }
      if (rules) {
        for (var i=0; i<rules.length; i++) {
          var rule = rules[i];
          if(rule.type == 1) {
            this.rulesList.push(new RuleModel(this, i, rule));
          }
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
      var rulePrechecker = this.styleAdjusterModel.rulePrechecker;
      var precheckedSavedValue = rulePrechecker.testSave(name, value);
      this.styleSheetModel.updatePropertyValue(this.index, name, value, 
                                               precheckedSavedValue);
      this.rule.cssText = this.cssTextModel.cssTextForUpdated(name, precheckedSavedValue);
      this.cssTextModel = new CssTextModel(this.rule.cssText);
      var newValue = precheckedSavedValue;
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
    
    updateValue: function(value) {
      this.ruleModel.setPropertyValue(this, value);
      var updatedValue = this.value.get();
      this.changed.set(updatedValue != this.originalValue);
    }, 
    
    updateFixedValue: function(fixedUpdateValue) {
      this.value.set(fixedUpdateValue);
      this.changed.set(fixedUpdateValue != this.originalValue);
    }, 
      
    resetValue: function() {
      this.updateValue(this.originalValue);
    }, 
    
    getExtraEditorModel: function() {
      if (this.type) {
        return getEditorModel(this.type);
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
      var errorMessage = null;
      if (this.properties.length != cssTextModel.properties.length) {
        errorMessage = "Updated rule has " + this.properties.length + " properties, but original rule had " + 
          cssTextModel.properties.length;
        successful = false;
      }
      for (var i=0; i<this.properties.length; i++) {
        var property = this.properties[i];
        var oldProperty = cssTextModel.properties[i];
        if (property.name != oldProperty.name) {
         errorMessage = "Updated rule has property " + inspect(property.name) + " in position " + i + 
            ", where original rule had " + inspect(oldProperty.name);
          successful = false;
        }
        if (property.name == name) {
          newValue = property.value;
        }
        else {
          if (property.value != oldProperty.value) {
            errorMessage = "In updated rule, property " + inspect(property.name) +
              " has value " + inspect(property.value) + " != " + inspect(oldProperty.value) +
              " (but property " + inspect(name) + " is the one being updated)";
            successful = false;
          }
        }
      }
      var result = {successful: successful, newValue: newValue};
      if (!successful) {
        result.errorMessage = errorMessage;
      }
      return result;
    }
  };

  function ValueEditorModel() {
    this.propertyModel = new Observable(null);
    this.selector = new Observable("");
    this.name = new Observable("");
    this.value = new Observable("");
    this.changed = new Observable(false);
    this.errorMessage = new Observable(null);
    this.formatsStateModel = new FormatsStateModel();
    this.sliderControlModel = new SliderControlModel();
    this.extraEditorModel = new Observable(null);
    var $this = this;
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

    /** Start editing a property from current value */
    editProperty: function(propertyModel) {
      this.clear();
      this.propertyModel.set(propertyModel);
      this.selector.set(propertyModel.ruleModel.rule.selectorText);
      this.name.set(propertyModel.name);
      this.value.set(propertyModel.value.get());
      this.changed.set(propertyModel.changed.get());
      var extraEditorModel = propertyModel.getExtraEditorModel();
      this.extraEditorModel.set(extraEditorModel);
      var $this = this;
      if(extraEditorModel) {
        extraEditorModel.receiveValueString(this.value.get(), [null, null]);
        this.updateSliderControlModel(extraEditorModel);
        extraEditorModel.onSendValueFromUser(function(value, valueObject, source) {
          $this.savePropertyValue(value);
          $this.echoUpdateBackToExtraEditor(extraEditorModel, valueObject, source);
          if (source == "format") {
            $this.updateSliderControlModel(extraEditorModel);
          }
        });
      }
    }, 
    
    /** After doing an update from the extra editor, check the updated value against
        the value object supplied by the extra editor. Also update the state of the
        extra editor. */
    echoUpdateBackToExtraEditor: function(extraEditorModel, valueObject, source) {
      var propertyModel = this.propertyModel.get();
      var updatedValue = propertyModel.value.get();
      var updatedValueObject = extraEditorModel.parseValue(updatedValue);
      var fixedUpdateValueObject = extraEditorModel.echoAndFixUpdatedValueObject(updatedValueObject, valueObject);
      if (fixedUpdateValueObject) {
        propertyModel.updateFixedValue(fixedUpdateValueObject.toString());
        this.updateFromPropertyModelUpdate(propertyModel);
      }
    }, 
    
    handleSaveError: function(error) {
      this.formatsStateModel.enabled.set(false);
      if (error instanceof InvalidPropertyValueError) {
        this.errorMessage.set(error.message);
        throw error;
      }
      else {
        this.errorMessage.set("ERROR SAVING: " + error.message);
        console.log("error = " + error);
        throw error;
      }
    }, 
    
    updateFromPropertyModelUpdate: function (propertyModel) {
      var value = propertyModel.value.get();
      this.value.set(value);
      this.changed.set(propertyModel.changed.get());
    }, 
      
    saveTextValue: function(value) {
      this.value.set(value); // (to re-sync value field)
      value = trim(value);
      this.value.set(value); // (to re-sync value field)
      var prenormalisedValue = value;
      var valueObject = null;
      var extraEditorModel = this.extraEditorModel.get();
      if (extraEditorModel) {
        var prenormalised = extraEditorModel.prenormalise(value);
        if(prenormalised) {
          prenormalisedValue = prenormalised.toString();
          valueObject = prenormalised;
        }
      }
      this.savePropertyValue(prenormalisedValue);
      if (valueObject) {
        this.echoUpdateBackToExtraEditor(extraEditorModel, valueObject, "text");
      }
      this.updateExtraEditorModel();
    }, 
    
    savePropertyValue: function(value) {
      this.clearErrorMessage();
      try {
        var propertyModel = this.propertyModel.get();
        this.propertyModel.get().updateValue(value);
        this.updateFromPropertyModelUpdate(propertyModel);
      }
      catch(error) {
        this.handleSaveError(error);
      }
    }, 
    
    resetValue: function() {
      this.clearErrorMessage();
      try {
        var propertyModel = this.propertyModel.get();
        propertyModel.resetValue();
        this.updateFromPropertyModelUpdate(propertyModel);
        this.updateExtraEditorModel();
      }
      catch(error) { // this shouldn't happen resetting, but just in case ...
        this.handleSaveError(error);
      }
    }, 
    
    updateSliderControlModel: function(extraEditorModel) {
      var sliderModels = [];
      extraEditorModel.getSliderModels(sliderModels);
      this.sliderControlModel.setSliderModels(sliderModels);
    },      
    
    updateExtraEditorModel: function() {
      var extraEditorModel = this.extraEditorModel.get();
      if (extraEditorModel) {
        var propertyModel = this.propertyModel.get();
        var value = propertyModel.value.get();
        extraEditorModel.receiveValueString(value, [null, null]);
        this.updateSliderControlModel(extraEditorModel);
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
  
  function getDocumentBody(aDocument) {
    var htmlElement = aDocument.documentElement;
    for (var i=0; i<htmlElement.children.length; i++) {
      var child = htmlElement.children[i];
      if(child.tagName.toLowerCase() == "body") {
        return child;
      }
    }
    throw new Error("Document body element not found");
  }
  
  function StyleAdjusterView(parentDom, styleAdjusterModel) {
    this.parentDom = parentDom;
    this.styleAdjusterModel = styleAdjusterModel;
    styleAdjusterModel.rulePrechecker = new RulePrechecker(document);
    this.initialiseDom($("body"), styleAdjusterModel);
  }

  StyleAdjusterView.prototype = {
    initialiseDom: function(parentDom, styleAdjusterModel) {
      this.outerDom = $("<div class='style-adjuster-outer'/>");
      this.dom = $("<div/>").appendTo(this.outerDom);;
      if (parentDom) {
        this.outerDom.appendTo(parentDom);
      }
      this.tabsDom = $("<div class = 'style-adjuster'/>").appendTo(this.dom);
      this.tabsHeadersDom = $("<ul/>").appendTo(this.tabsDom);
      this.tabsById = {}
      
      this.styleSheetsView = new StyleSheetsView(styleAdjusterModel);
      this.addTab("sheets", "Style Sheets", "Select which document style sheets to work on", this.styleSheetsView);
      
      this.rulesView = new RulesView(this.styleAdjusterModel);
      this.addTab("rules", "Rules", "Select which rule properties to edit", this.rulesView);
      
      this.editView = new EditView(this.styleAdjusterModel);
      this.addTab("edit", "Edit", "Edit selected rule properties", this.editView);
      
      this.changesView = new ChangesView(this.styleAdjusterModel);
      this.addTab("changes", "Changes", "View and changes made in CSS format", this.changesView);
      
      this.helpView = new HelpView();
      this.addTab("help", null, "Help", this.helpView, "icons/tab-icon.png");
      
      $this = this;
      function activateTab(tabId) {
        var tabView = $this.tabsById[tabId];
        if (tabView.activate) {
          $this.tabsById[tabId].activate();
        }
      }
      this.dom.tabs({active: 1, activate: function(event, ui) {
        var tabId = ui.newPanel[0].id;
        activateTab(tabId);
      }});
      activateTab("rules");
      this.tabsDom.find("> ul > li:last-child").css("float", "right");
    }, 
    
    addTab: function(id, label, tooltip, view, imageUrl) {
      this.tabsById[id] = view;
      var linkItemDom = $("<a/>").attr("href", "#" + id).attr("title", tooltip);
      if (label) {
        linkItemDom.text(label);
      }
      if (imageUrl) {
        var iconDom = $("<img class='icon'/>").attr("src", imageUrl);
        linkItemDom.append(iconDom);
      }
      this.tabsHeadersDom.append($("<li/>").append(linkItemDom));
      var tabDiv = $("<div class='tab'/>").attr("id", id).append(view.dom).appendTo(this.tabsDom);
    }
  };

  function HelpView() {
    this.dom = $("<div class='help'/>");
    var $this = this;
    this.dom.load(options.helpHtmlUrl, function(responseText, textStatus, xhr) {
      if (textStatus == "success") {
        listPropertyTypesInHtmlTable($this.dom.find("#property-editors-list"));
      }
      else {
        alert("Error loading lib/help.html: " + textStatus + " " + xhr.status);
      }
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
    if(styleSheetModel.accessError) {
      var styleSheetHref = styleSheetModel.styleSheet.href;
      var accessErrorMessage = $("<div class='access-error'/>").appendTo(this.dom);
      accessErrorMessage.append($("<p/>").append("Failed to access rules for styleSheet ", 
                                                 $("<b/>").text(styleSheetHref), 
                                                "."));
      if (styleSheetHref) {
        var httpMatch = styleSheetHref.match("^((?:https|http)://[^/]+/)");
        if (httpMatch) {
          $("<p/>").text("Style Adjuster cannot access stylesheets loaded from " + 
                         "HTTP/HTTPS servers on different domains.").appendTo(accessErrorMessage);
        }
        var fileMatch = styleSheetHref.match("^(file:)");
        if (fileMatch) {
          $("<p/>").append("To access stylesheets loaded from ", 
                           $("<b/>").text("file"), 
                           " URLs, Chrome (or Chromium) must be run with the ", 
                           $("<b/>").text(withNonBreakingHyphens("--allow-file-access-from-files")), 
                           " flag.").appendTo(accessErrorMessage);
        }
      }
    }
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
    this.sliderControlView = new SliderControlView(valueEditorModel.sliderControlModel);
    var $this = this;
    var valueEditorModel = this.valueEditorModel;
    this.saveButton.on("click", function(event, ui) {
      $this.saveTextValue();
      $this.valueField.focus();
    });
    this.resetButton.on("click", function(event, ui) {
      valueEditorModel.resetValue();
      $this.valueField.focus();
    });
    this.valueField.on("keypress", function(event, ui) {
      if (event.which == 13) {
        $this.saveTextValue();
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
        $this.extraEditorDom.append($this.sliderControlView.dom);
        $this.extraEditorDom.show();
      };
    });
  }

  ValueEditorView.prototype = {
    saveTextValue: function() {
      this.saveButton.prop("disabled", true);
      this.valueEditorModel.saveTextValue(this.valueField.val());
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
    this.active = new Observable(false);
  }

  SliderControlModel.prototype = {
    setSliderModels: function(sliderModels) {
      this.sliderModels = sliderModels;
      var active = sliderModels.length > 0;
      this.active.set(active);
      var currentEditorModelIsActive = false;
      var currentEditorModel = this.editorModel.get();
      for (var i=0; i<sliderModels.length; i++) {
        var sliderModel = sliderModels[i];
        sliderModel.sliderControlModel = this;
        if (currentEditorModel == sliderModel) {
          currentEditorModelIsActive = true;
        }
      }
      this.setEditorModel(active 
                          ? (currentEditorModelIsActive ? currentEditorModel : sliderModels[0])
                          : null);
    }, 
    unfocusCurrentEditorModel: function () {
      var previousEditorModel = this.editorModel.get();
      if(previousEditorModel) {
        previousEditorModel.focussed.set(false);
      }
    }, 
    setEditorModel: function(editorModel) {
      this.unfocusCurrentEditorModel();
      this.label.set(editorModel ? editorModel.description : null);
      this.value.set(editorModel ? editorModel.valueString : null);
      this.range.set(editorModel ? editorModel.range.get() : null);
      this.editorModel.set(editorModel);
      if (editorModel) {
        editorModel.focussed.set(true);
      }
    }, 
    updateValue: function(value) {
      this.value.set(value);
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
    this.sliderControlModel.active.nowAndOnChange(function(active) {
      $this.dom.toggle(active);
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

  function ComponentsEditorModel(type, valueParser, labels, componentDescriptions) {
    this.divClass = "components";
    this.view = null;
    this.type = type;
    this.valueParser = valueParser;
    this.labels = labels;
    this.componentDescriptions = componentDescriptions;
    this.firstEditorModel = null;
    this.updateValueHandler = null;
    this.parsedLabels = new Observable([]);
    this.initialiseEditorModel();
  }

  ComponentsEditorModel.prototype = {
    viewClass: ComponentsEditorView, 
    
    initialiseEditorModel: function() {
      this.editorModels = {};
      for (var i=0; i<this.labels.length; i++) {
        var label = this.labels[i];
        var editorModel = getEditorModel(this.type.componentTypes[label]);
        if (editorModel) {
          editorModel.label = label;
          this.editorModels[label] = editorModel;
          this.handleValueSentFrom(label, editorModel);
        }
      }
    }, 
    
    parseValue: function(valueString) {
      return this.valueParser.parse(valueString);
    }, 
    echoAndFixUpdatedValueObject: function (updatedValueObject, valueObject) {
      var anyFixed = false;
      
      for (var i=0; i<this.labels.length; i++) {
        var label = this.labels[i];
        var updatedComponent = updatedValueObject[label];
        var componentValue = valueObject[label];
        var editorModel = this.editorModels[label];
        if (editorModel && componentValue) {
          var fixedComponentValue = editorModel.echoAndFixUpdatedValueObject(updatedComponent, componentValue);
          if (fixedComponentValue) {
            anyFixed = true;
            updatedValueObject[label] = fixedComponentValue;
          }
        }
      }
      anyFixed = anyFixed || this.fixParsedValue(updatedValueObject, valueObject);
      if (anyFixed) {
        this.valueObject = valueObject;
      }
      return anyFixed ? updatedValueObject : null;
    }, 
    
    // A hook to make fixes at the structural level, i.e. fill in deleted components
    fixParsedValue: function(parsedUpdatedValue, valueObject) {
      // default do nothing
      return false;
    }, 
    
    prenormalise: function(valueString) {
      var parsedValue = this.parseValue(valueString);
      if (parsedValue == null) {
        return null;
      }
      else { // recursively prenormalise
        var newValueObject = merge(parsedValue);
        var labels = parsedValue.labels;
        for (var i=0; i<labels.length; i++) {
          var label = labels[i];
          var editorModel = this.editorModels[label];
          if (editorModel) {
            var prenormalisedComponent = editorModel.prenormalise(parsedValue[label].toString());
            if (prenormalisedComponent) {
              newValueObject[label] = prenormalisedComponent;
            }
          }
        }
        return newValueObject;
      }
    }, 

    /** A value string from initial editing (presumed to be valid, and accepted in the given format)*/
    receiveValueString: function(valueString, description) {
      this.parsedValue = this.parseValue(valueString);
      if(!this.parsedValue) {
        this.parsedLabels.set([]);
      }
      else {
        var labels = this.parsedValue.labels;
        this.firstEditorModel = null;
        var descriptions = this.componentDescriptions.getDescriptions(labels);
        for (var i=0; i<labels.length; i++) {
          var label = labels[i];
          var editorModel = this.editorModels[label];
          if (editorModel) {
            if (this.firstEditorModel == null) {
              this.firstEditorModel = editorModel;
            }
            editorModel.receiveValueString(this.parsedValue[label].toString(), descriptions[label]);
          }
        }
        this.parsedLabels.set(labels);
      }
      this.setValueObject();
    }, 
    
    setValueObject: function() {
      if (this.parsedValue) {
        this.valueObject = merge(this.parsedValue);
        var labels = this.parsedValue.labels;
        for (var i=0; i<labels.length; i++) {
          var label = labels[i];
          var editorModel = this.editorModels[label];
          if (editorModel) {
            this.valueObject[label] = editorModel.valueObject;
          }
        }
      }
      else {
        this.valueObject = null;
      }
    }, 
    
    getSliderModels: function(sliderModels) {
      var parsedLabels = this.parsedLabels.get();
      for (var i=0; i<parsedLabels.length; i++) {
        var editorModel = this.editorModels[parsedLabels[i]];
        if (editorModel) {
          editorModel.getSliderModels(sliderModels);
        }
      }
    }, 
    
    setDescription: function(description) {
      this.description = description; // todo - show in the view
    }, 
    
    onSendValueFromUser: function(handler) {
      this.sendValueFromUserHandler = handler;
    }, 
    
    focus: function() {
      if (this.firstEditorModel) {
        this.firstEditorModel.focus();
      }
    }, 
    
    handleValueSentFrom: function(label, editorModel) {
      var $this = this;
      editorModel.onSendValueFromUser(function(value, valueObject, source) {
        $this.handleLabelValueFromUser($this.parsedValue, label, value, valueObject, source);
      });
    }, 
    
    sendValueFromUser: function(value, valueObject, source) {
      if (value != null && this.sendValueFromUser != null) {
        this.sendValueFromUserHandler(value, valueObject, source);
      }
    },      
    
    updatedValueObjectToSendOn: function(label, valueObject) {
      var updatedValueObject = merge(this.valueObject);
      updatedValueObject[label] = valueObject;
      return updatedValueObject;
    }, 
    
    handleLabelValueFromUser: function(parsedValue, label, value, valueObject, source) {
      this.parsedValue[label] = valueObject;
      var wrappedSource = {};
      wrappedSource[label] = source;
      this.sendValueFromUser(parsedValue.toString(), this.updatedValueObjectToSendOn(label, valueObject), 
                             wrappedSource);
    }
  };

  function ComponentsEditorView(componentsEditorModel) {
    this.componentsEditorModel = componentsEditorModel;
    componentsEditorModel.view = this;
    this.dom = $("<div/>").addClass(componentsEditorModel.divClass);
    var editorModels = componentsEditorModel.editorModels;
    var labels = componentsEditorModel.labels;
    for (var i=0; i<labels.length; i++) {
      var label = labels[i];
      var editorModel = editorModels[label];
      if (editorModel) {
        this.dom.append(editorModel.view.dom);
      }
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
        if (editorModel) {
          var active = $.inArray(label, parsedLabels) != -1;
          editorModel.view.dom.toggle(active);
        }
      }
    }
  };

  function DimensionEditorModel(type) {
    this.type = type;
    this.negativeAllowed = type.negativeAllowed;
    this.sliderControlModel = null;
    this.initialise();
  }

  DimensionEditorModel.prototype = {
    viewClass: DimensionEditorView, 
    
    prenormalise: function(valueString) {
      return null;
    }, 
    
    /** A value string from initial editing (presumed to be valid, and accepted in the given format)*/
    receiveValueString: function(valueString, description) {
      this.valueString = valueString;
      this.size = null;
      var match = this.sizeRegex.exec(valueString);
      if (match) {
        this.sizeString = match[1];
        this.size = parseFloat(this.sizeString);
        this.unit = match.length >= 3 ? match[2] : "";
        this.resetRange(); // this will cause UI to update
      }
      this.setDescription(description);
      this.setValueObject();
    }, 
    
    setValueObject: function() {
      this.valueObject = this.size == null ? null 
        : {size: this.size, sizeString: this.sizeString, unit: this.unit};
    },      
    
    getSliderModels: function(sliderModels) {
      sliderModels.push(this);
    }, 
    initialise: function() {
      this.view = null; // The view should set this
      this.range = new Observable(null);
      this.updateValueHandler = null;
      this.description = null;
      this.shortDescription = new Observable(null);
      this.focussed = new Observable(false);
    }, 
    
    onSendValueFromUser: function(handler) {
      this.sendValueFromUserHandler = handler;
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
      if (this.sliderControlModel) {
        this.sliderControlModel.setEditorModel(this);
      }
    },    
    
    focus: function() {
      this.setAsFocussedModel();
      $(this).trigger("modelFocus");
    }, 
    
    setDescription: function(description) {
      this.shortDescription.set(description[0]);
      this.description = description[1];
    }, 
    
    sendValueFromUser: function(value, valueObject, source) {
      if (this.sendValueFromUserHandler != null) {
        this.sendValueFromUserHandler(value, valueObject, source);
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

    setSizeFromUser: function(position) {
      this.sizeString = this.range.get().valueAtPosition(position);
      this.size = parseFloat(this.sizeString);
      this.valueString = this.sizeString + this.unit;
      this.setValueObject();
      if (this.sliderControlModel) {
        this.sliderControlModel.updateValue(this.valueString);
      }
      this.sendValueFromUser(this.valueString, this.valueObject, "slide");
    }
  };
  
  function CssSize(size, sizeString, unit) {
    this.size = size;
    this.sizeString = sizeString;
    this.unit = unit;
  }
  
  CssSize.prototype = {
    toString: function() {
      return this.sizeString + this.unit;
    }
  };
  
  var cssSizeParser = {
    regex: /^([-]?[0-9.]+)(%|in|cm|mm|px|pt|em|ex|rem|pc|)$/, 
    
    parse: function(valueString) {
      var match = this.regex.exec(valueString);
      if (match) {
        var numberString = match[1];
        var number = parseFloat(numberString);
        var unit = match[2];
        return new CssSize(number, numberString, unit);
      }
      else {
        return null;
      }
    }
  };
  
  CssSize.prototype = {
    toString: function() {
      return this.sizeString + this.unit;
    }
  };

  function CssDimensionEditorModel(type) {
    DimensionEditorModel.call(this, type);
  }

  CssDimensionEditorModel.prototype = merge(DimensionEditorModel.prototype, {

    sizeRegex: /^([-]?[0-9.]+)(%|in|cm|mm|px|pt|em|ex|rem|pc)$/, 
    
    parseValue: function(valueString) {
      return cssSizeParser.parse(valueString);
    }, 

    prenormalise: function(valueString) {
      var sizeObject = cssSizeParser.parse(valueString);
      if (sizeObject) {
        if (sizeObject.unit == "") {
          sizeObject.unit = "px";
          valueString = sizeObject.toString();
        }
      }
      return sizeObject;
    }, 
    
    getRangesForUnit: function() {
      return cssUnitRanges[this.unit];
    }, 
    
    echoAndFixUpdatedValueObject: function (updatedValueObject, valueObject) {
      var fixedValueObject = null;
      if (updatedValueObject.size == 0 && updatedValueObject.unit == "px" && valueObject.unit != "px") {
        fixedValueObject = new CssSize(0, "0", valueObject.unit);
      }
      return fixedValueObject;
    }, 
    
    setValueObject: function() {
      this.valueObject = this.size == null ? null : new CssSize(this.size, this.sizeString, this.unit);
    }
    
  });
  
  function FourCssSizes(top, right, bottom, left) {
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
    this.setLabels();
  }
  
  FourCssSizes.prototype = {
    setLabels: function() {
      this.labels = this.left ? ["top", "right", "bottom", "left"]
        : (this.bottom ? ["top", "right", "bottom"]
           : (this.right ? ["top", "right"] : ["top"]));
    }, 
    
    toString: function() {
      return this.top.toString() 
        + (this.right ? (" " + this.right.toString()) : "")
        + (this.bottom ? (" " + this.bottom.toString()) : "")
        + (this.left ? (" " + this.left.toString()) : "");
    }, 
    
    withComponentUpdated: function(label, value) {
      var clone = new FourCssSizes(this.top, this.right, this.bottom, this.left);
      clone[label] = value;
      return clone;
    }
  };
  
  var cssSizePattern =  "((?:[-]?[0-9.]+)(?:%|in|cm|mm|px|pt|em|ex|rem|pc|))";
  
  var fourCssDimensionsParser = {
    regex: new RegExp(itemsPattern([cssSizePattern, cssSizePattern, 
                                    cssSizePattern, cssSizePattern])), 
    parse: function(valueString) {
      var match = valueString.match(this.regex);
      if(match && match[1]) {
        var size = [null, null, null, null];
        for (var i=0; i<4; i++) {
          size[i] = match[i+1] ? cssSizeParser.parse(match[i+1]) : null;
        }
        return new FourCssSizes(size[0], size[1], size[2], size[3]);
      }
      else {
        return null;
      }
    }
  }
  
  function ColorComponentEditorModel(type) {
    DimensionEditorModel.call(this, type);
  }

  ColorComponentEditorModel.prototype = merge(DimensionEditorModel.prototype, {

    sizeRegex: /^([-]?[0-9.]+)$/, 
    
    getRangesForUnit: function() {
      return colorRange;
    }, 

    setValueObject: function() {
      this.valueObject = this.size;
    }
    
  });

  function HueComponentEditorModel(type) {
    console.log("HueComponentEditorModel, type = " + inspect(type));
    DimensionEditorModel.call(this, type, false);
  }

  HueComponentEditorModel.prototype = merge(DimensionEditorModel.prototype, {

    sizeRegex: /^([0-9.]+)$/, 
    
    getRangesForUnit: function() {
      return hueRange;
    }, 

    setValueObject: function() {
      this.valueObject = this.size;
    }      
    
  });

  function PercentageComponentEditorModel(type) {
    DimensionEditorModel.call(this, type, false);
  }

  PercentageComponentEditorModel.prototype = merge(DimensionEditorModel.prototype, {

    sizeRegex: /^([0-9.]+)(%)$/, 
    
    getRangesForUnit: function() {
      return percentageRange;
    }, 
    
    setValueObject: function() {
      this.valueObject = this.size == null ? null : new Percentage(this.size);
    }     
    
  });

  function AlphaComponentEditorModel(type) {
    DimensionEditorModel.call(this, type, false);
  }

  AlphaComponentEditorModel.prototype = merge(DimensionEditorModel.prototype, {

    sizeRegex: /^([0-9.]+)$/, 
    
    getRangesForUnit: function() {
      return alphaRange;
    }, 
    
    setValueObject: function() {
      this.valueObject = this.size;
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
    parseValue: function(value) {
      return colorParser.parse(value);
    }, 
    
    resetUpdatedValueObject: function(updatedValueObject, parsedInputValue, formatsStateModel) {
      var newValue = updatedValueObject;
      if (updatedValueObject.format != parsedInputValue.format) {
        var reconstructibleFormats = updatedValueObject.reconstructibleFormats();
        if ($.inArray(parsedInputValue.format, reconstructibleFormats) != -1) {
          newValue = updatedValueObject.convertToFormat(parsedInputValue.format);
        }
        else {
          // test conversion, but don't actually use the result ...
          var testNewValue = updatedValueObject.convertToFormat(parsedInputValue.format);
          
          newValue = parsedInputValue;
        }
      }
      this.valueChanged(newValue, formatsStateModel);
      return newValue;
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
    this.dom = $("<div class='formats'/>").append($("<span class='label'/>").text("Format: "));
    this.selectDom = $("<select/>").appendTo(this.dom);
    this.formatsModel = null;
    var $this = this;
    formatsStateModel.formats.nowAndOnChange(function (formats) {
      $this.dom.toggleClass("hidden", formats == null);
      if (formats != null) {
        $this.setOptions(formats);
        var selectedFormat = formatsStateModel.selectedFormat.get();
        $this.selectDom.find("option").each(function() {
          this.selected = (this.value == selectedFormat);
        });
      }
    });
    formatsStateModel.selectedFormat.nowAndOnChange(function(selectedFormat) {
      $this.selectDom.find("option").each(function() {
        this.selected = (this.value == selectedFormat);
      });
    });
    formatsStateModel.formatsEnabled.nowAndOnChange(function(formatsEnabled) {
      $this.selectDom.find("option").each(function() {
        this.disabled = !formatsEnabled[this.value];
      });
    });
    formatsStateModel.enabled.nowAndOnChange(function(enabled) {
      $this.selectDom.prop("disabled", !enabled);
    });
    this.selectDom.change(function(event, ui) {
      formatsStateModel.selectedFormat.set($(this).val());
    });
  }

  FormatsView.prototype = {
    setFormatsModel: function(formatsModel) {
      this.formatsModel = formatsModel;
    }, 
    
    setOptions: function(formats) {
      this.selectDom.empty();
      for (var i=0; i<formats.length; i++) {
        var format = formats[i];
        this.selectDom.append($("<option/>").attr("value", format).text(format));
      }
    }
  };

  function DimensionEditorView(dimensionEditorModel) {
    this.dimensionEditorModel = dimensionEditorModel;
    dimensionEditorModel.view = this;
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
        dimensionEditorModel.setSizeFromUser(position);
      }
    };
    this.sliderDom.slider({min: 0, max: 100, slide: sliderChanged, change: sliderChanged});
    this.sliderDom.focusin(function() {
      $this.dimensionEditorModel.setAsFocussedModel();
    });
    
    this.dimensionEditorModel.focussed.nowAndOnChange(function (focussed) {
      $this.dom.toggleClass("focussed", focussed);
    });
    
    this.dimensionEditorModel.shortDescription.nowAndOnChange(function(shortdescription) {
      shortDescriptionWrapperDom.toggle(shortdescription != null);
      $this.shortDescriptionDom.text(shortdescription == null ? "" : shortdescription);
    });
    
    this.dimensionEditorModel.range.onChange(function(range) {
      $this.lowerValueDom.text(range.lowerString);
      $this.upperValueDom.text(range.upperString);
      $this.ignoreValueChanges = true;
      var newPosition = range.positionForValue(dimensionEditorModel.size);
      $this.sliderDom.slider("option", "value", 100 * newPosition);
      $this.unitDom.text(range.unit);
      $this.ignoreValueChanges = false;
    });
    
    $(this.dimensionEditorModel).on("zoomEdited", function() {
      $this.focusOnSlider();
    });
    
    $(this.dimensionEditorModel).on("modelFocus", function() {
      $this.focusOnSlider();
    });
    
  }

  DimensionEditorView.prototype = {
    editorModelClass: DimensionEditorView, 
    focusOnSlider: function() {
      this.sliderDom.find(".ui-slider-handle").focus();
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
  ColorRange.prototype = merge(BoundedNonNegativeIntegerRange.prototype);

  var colorRange = new ColorRange(10);

  function HueRange(minRange) {
    BoundedNonNegativeIntegerRange.call(this, minRange, 360, "");
  }
  HueRange.prototype = merge(BoundedNonNegativeIntegerRange.prototype);

  var hueRange = new HueRange(10);

  function PercentageRange(minRange) {
    BoundedNonNegativeIntegerRange.call(this, minRange, 100, "%");
  }
  PercentageRange.prototype = merge(BoundedNonNegativeIntegerRange.prototype);

  var percentageRange = new PercentageRange(10);

  /** ===== Component Descriptions ==================================================== */
  
  function ComponentDescriptions(descriptions) {
    this.descriptions = descriptions;
  }
  
  ComponentDescriptions.prototype = {
    getDescriptions: function(parsedLabels) {
      return this.descriptions;
    }
  };

  function TrblDescriptions() {
    ComponentDescriptions.call(this, 
                               {top: ["T", "Top"], 
                                right: ["R", "Right"], 
                                bottom: ["B", "Bottom"], 
                                left: ["L", "Left"], 
                                topAndBottom: ["T/B", "Top/Bottom"], 
                                rightAndLeft: ["R/L", "Right/Left"], 
                                all: [null, "All"]});
    this.descriptionsByComponentNumber = [null, 
                                          {top: this.descriptions.all}, 
                                          {top: this.descriptions.topAndBottom, 
                                           right: this.descriptions.rightAndLeft}, 
                                          {top: this.descriptions.top, 
                                           right: this.descriptions.rightAndLeft, 
                                           bottom: this.descriptions.bottom}, 
                                          {top: this.descriptions.top, 
                                           right: this.descriptions.right, 
                                           bottom: this.descriptions.bottom, 
                                           left: this.descriptions.left}];
  }
  
  TrblDescriptions.prototype = merge(ComponentDescriptions.prototype, {
    getDescriptions: function(parsedLabels) {
      return this.descriptionsByComponentNumber[parsedLabels.length];
    }
  });
  
  var colorComponentDescriptions = 
    new ComponentDescriptions({red: ["R", "Red"], 
                               green: ["G", "Green"], 
                               blue: ["B", "Blue"], 
                               hue: ["H", "Hue"], 
                               saturation: ["S", "Saturation"], 
                               lightness: ["L", "Lightness"], 
                               alpha: ["A", "Alpha"]});
  
  /** ===== Specific model editors ==================================================== */
  
  function cssDimensionEditor(type) {
    var model = new CssDimensionEditorModel(type);
    new DimensionEditorView(model);
    return model;
  }

  /** ----------------------------------------------------------------------------- */
  var cssSizePattern = "([-]?[0-9.]+(?:%|in|cm|mm|px|pt|em|ex|rem|pc|))";
  
  var borderStylePattern = "(none|dotted|dashed|solid|double|groove|ridge|inset|outset)";
  
  var colorStylePattern = "((?:rgba|rgb|hsla|hsl)\\([^)]*\\)|#[a-zA-Z0-9]+|[a-zA-Z]+)";
  

  /** Return a regex for a sequence of items (all optional, but there will always be at least one
   in practice) separated by whitespace. */
  function itemsPattern(patterns) {
    var result = "^(?:\\s*)";
    for (var i=0; i<patterns.length; i++) {
      var pattern = patterns[i];
      result = result + "(?:" + pattern + "(?:\\s+|\\s*$)|)";
    }
    result = result + "$";
    return result;
  }
  
  /** ----------------------------------------------------------------------------- */
  var borderPattern = itemsPattern([cssSizePattern, borderStylePattern, colorStylePattern]);
  
  function BorderProperty(width, style, color) {
    this.width = width;
    this.style = style;
    this.color = color;
  }
  
  BorderProperty.prototype = {
    labels: ["width", "style", "color"], 
    toString: function() {
      return this.width.toString() + " " + this.style.toString() + " " + this.color.toString();
    }, 
    withComponentUpdated: function(label, value) {
      var clone = new BorderProperty(this.width, this.style, this.color);
      clone[label] = value;
      return clone;
    }
  };
  
  var borderPropertyParser = {
    regex: new RegExp(borderPattern), 
    parse: function(valueString) {
      var match = valueString.match(this.regex);
      if (match) {
        var width = cssSizeParser.parse(match[1]);
        var style = match[2];
        var color = colorParser.parse(match[3]);
        return new BorderProperty(width, style, color);
      }
      else {
        return null;
      }
    }
  }
  
  var borderComponentDescriptions = new ComponentDescriptions({width: ["W", "Width"], 
                                                               style: ["S", "Style"], 
                                                               color: ["C", "Color"]});
  
  function BorderEditorModel(type) {
    ComponentsEditorModel.call(this, 
                               type, borderPropertyParser, 
                               ["width", "style", "color"], 
                               borderComponentDescriptions);
  }
  BorderEditorModel.prototype = ComponentsEditorModel.prototype;
  
  /** ----------------------------------------------------------------------------- */
  function getEditorModel(type) {
    var editorModelClass = type.editorModelClass;
    if (editorModelClass) {
      var editorModel = new editorModelClass(type);
      var viewClass = editorModel.viewClass;
      new viewClass(editorModel);
      return editorModel;
    }
    else {
      return null;
    }
  }
    
  function CssDimensionType(allowNegative, description) {
    this.allowNegative = allowNegative;
    this.description = description;
  }
  
  CssDimensionType.prototype = {
    editorModelClass: CssDimensionEditorModel
  };
    
  var cssSizeType = new CssDimensionType(false, "Size");
  var cssPositionType = new CssDimensionType(true, "Position");
  
  /** ----------------------------------------------------------------------------- */
  function FourCssDimensionsEditorModel(type) {
    ComponentsEditorModel.call(this, 
                               type, 
                               fourCssDimensionsParser, 
                               ["top", "right", "bottom", "left"], 
                               new TrblDescriptions());
  }
  
  FourCssDimensionsEditorModel.prototype = merge(ComponentsEditorModel.prototype, {
    defaultLabelForMissingLabel: {right: "top", bottom: "top", left: "right"}, 
    
    fixParsedValue: function(parsedUpdatedValue, valueObject) {
      var numLabelsInUpdate = parsedUpdatedValue.labels.length;
      var numLabelsInValue = valueObject.labels.length;
      var anyToFix = numLabelsInUpdate < numLabelsInValue;
      if (anyToFix) {
        for (var i=numLabelsInUpdate; i<numLabelsInValue; i++) {
          var missingLabel = valueObject.labels[i];
          parsedUpdatedValue[missingLabel] = 
            parsedUpdatedValue[this.defaultLabelForMissingLabel[missingLabel]];
          parsedUpdatedValue.labels.push(missingLabel);
        }
      }
      return anyToFix;
    }
  });

  function fourCssDimensionsEditorModel(type) {
    var model = new FourCssDimensionsEditorModel(type);
    new ComponentsEditorView(model);
    return model;
  }
  
  function FourCssDimensionsType(componentType) {
    this.allowNegative = componentType.allowNegative;
    this.componentTypes = {top: componentType, right: componentType, 
                           bottom: componentType, left: componentType}
    this.description = componentType.description + "s for top/right/bottom/left";
  }
                           
  FourCssDimensionsType.prototype = {
    editorModelClass: FourCssDimensionsEditorModel
  };
  
  var fourCssSizesType = new FourCssDimensionsType(cssSizeType);
  var fourCssPositionsType = new FourCssDimensionsType(cssPositionType);

  /** ----------------------------------------------------------------------------- */
  function colorComponentEditor(type) {
    var model = new ColorComponentEditorModel(type);
    new DimensionEditorView(model);
    return model;
  }

  function hueComponentEditor(type) {
    var model = new HueComponentEditorModel(type);
    new DimensionEditorView(model);
    return model;
  }

  function percentageComponentEditor(type) {
    var model = new PercentageComponentEditorModel(type);
    new DimensionEditorView(model);
    return model;
  }

  function alphaComponentEditor(type) {
    var model = new AlphaComponentEditorModel(type);
    new DimensionEditorView(model);
    return model;
  }
  
  function ColorEditorModel(type) {
    ComponentsEditorModel.call (this, 
                                type, 
                                colorParser, 
                                ["red", "green", "blue", "hue", "saturation", "lightness", "alpha"], 
                                colorComponentDescriptions);
    this.divClass = 'color';
    this.formatsStateModel = new FormatsStateModel();
    this.formatsController = new ColorFormatsController();
    var $this = this;
    this.formatsStateModel.selectedFormat.onChange(function(selectedFormat) {
      var value = $this.formatsStateModel.value;
      if (value.format != selectedFormat) {
        var newValue = value.convertToFormat(selectedFormat);
        if(!newValue) {
          throw new Error("Failed to convert " + value + " to format " + inspect(selectedFormat));
        }
        var newValueString = newValue.toString();
        $this.receiveValueString(newValueString); // update itself first before sending new data out
        $this.sendValueFromUser(newValueString, newValue, "format");
      }
    });

  }
  
  ColorEditorModel.prototype = merge(ComponentsEditorModel.prototype, {
    viewClass: ColorEditorView, 
    
    prenormalise: function(valueString) {
      return this.valueParser.parse(valueString);
    }, 

    updatedValueObjectToSendOn: function(label, valueObject) {
      return this.valueObject.withComponentUpdated(label, valueObject);
    }, 

    echoAndFixUpdatedValueObject: function (updatedValueObject, valueObject) {
      var fixedValueObject = this.formatsController.resetUpdatedValueObject(updatedValueObject, valueObject, 
                                                                            this.formatsStateModel);
      return fixedValueObject;
    }, 
    
    setValueObject: function() {
      this.valueObject = this.parsedValue;
    }, 
    
    receiveValueString: function(valueString) {
      ComponentsEditorModel.prototype.receiveValueString.call(this, valueString);
      this.formatsStateModel.setFormatsController(this.formatsController, valueString);
    }
  });
  
  function ColorEditorView(colorEditorModel) {
    ComponentsEditorView.call(this, colorEditorModel);
    this.formatsStateView = new FormatsView(colorEditorModel.formatsStateModel);
    this.dom.prepend(this.formatsStateView.dom);
  }
  
  ColorEditorView.prototype = merge(ComponentsEditorView.prototype, {
  });
    
  function colorEditorModel(type) {
    var model = new ColorEditorModel(type);
    new ColorEditorView(model);
    return model;
  }
  
  var stringType = {
  };
  
  var colorComponentType = {
    allowNegative: false, 
    editorModelClass: ColorComponentEditorModel
  };
  
  var hueType = {
    allowNegative: false, 
    editorModelClass: HueComponentEditorModel
  };
  
  var percentageType = {
    allowNegative: false, 
    editorModelClass: PercentageComponentEditorModel
  };
  
  var alphaType = {
    allowNegative: false, 
    editorModelClass: AlphaComponentEditorModel
  };

  var colorType = {
    description: "Color", 
    componentTypes: {red: colorComponentType, green: colorComponentType, blue: colorComponentType, 
                     hue: hueType, saturation: percentageType, lightness: percentageType, 
                     alpha: alphaType, name: stringType}, 
    editorModelClass: ColorEditorModel
  };
  
  var borderType = {
    description: "Border", 
    componentTypes: {width: cssSizeType, style: stringType, color: colorType}, 
    editorModelClass: BorderEditorModel
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
    this.setType(fourCssPositionsType, 
                 ["margin"]);
    this.setType(fourCssSizesType, 
                 ["padding", "border-width"]);
    this.setType(cssSizeType, 
                 ["font-size", "width", "min-width", "max-width"]);
    this.setType(colorType, 
                 ["color", "background-color", "border-color"]);
    this.setType(colorType, 
                 this.templatedTrbl(["border-{trbl}-color"]))
    
    this.setType(cssSizeType, 
                 this.templatedTrbl(["padding-{trbl}", "border-{trbl}-width"]))
    this.setType(cssPositionType, 
                 this.templatedTrbl(["margin-{trbl}"]))
    this.setType(borderType, ["border"]);
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
  
  // export publicly accessible classes & functions
  lib.StyleAdjusterModel = StyleAdjusterModel;
  lib.StyleAdjusterView = StyleAdjusterView;
  lib.options = options;
  

})(window.STYLE_ADJUSTER);


