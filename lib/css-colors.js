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
    return ["name", "rgb", "rgba", "hex"];
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
  
  enabledFormats: function() {
    return ["rgb", "rgba", "hex"];
  }, 
  
  convertToFormat: function(format) {
    console.log("RgbColor.convertToFormat, format = " + inspect(format));
    if (format == "rgba") {
      return new RgbaColor(this.red, this.green, this.blue, 1.0);
    }
    else if (format == "rgb" || format == "hex") {
      return new RgbColor(this.red, this.green, this.blue, format);
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
  
  parse: function (colorString) {
    var match = colorString.match(RgbaColor.prototype.regex);
    if (match) {
      return new RgbaColor(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseFloat(match[4]));
    }
    else {
      return null;
    }
  }, 

  enabledFormats: function() {
    return this.alpha == 1.0 ? ["rgb", "rgba", "hex"] : ["rgba"];
  }, 

  convertToFormat: function(format) {
    if (format == "rgb" || format == "hex") {
      return new RgbColor(this.red, this.blue, this.green, format);
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
  regex: /^hsl\(([0-9]+),\s*([0-9]+)%,\s*([0-9]+)%\)$/, 
  
  parse: function (colorString) {
    var match = colorString.match(HslColor.prototype.regex);
    if (match) {
      return new HslColor(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
    else {
      return null;
    }
  }, 

  enabledFormats: function() {
    return ["hsl", "hsla"];
  }, 

  convertToFormat: function(format) {
    if (format == "hsla") {
      return new HslaColor(this.hue, this.saturation, this.lightness, 1.0);
    }
  }, 

  toString: function() {
    return "hsl(" + this.hue + ", " + this.saturation + "%, " + this.lightness + "%)";
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
  regex: /^hsla\(([0-9]+),\s*([0-9]+)%,\s*([0-9]+)%,\s*([0-9.]+)%,\s*([0-9.]+)\)$/, 
  
  parse: function (colorString) {
    var match = colorString.match(HslColor.prototype.regex);
    if (match) {
      return new HslaColor(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseFloat(match[4]));
    }
    else {
      return null;
    }
  }, 

  enabledFormats: function() {
    return this.alpha == 1.0 ? ["hsl", "hsla"] : ["hsla"];
  }, 

  convertToFormat: function(format) {
    if (format == "hsl") {
      return new HslColor(this.hue, this.saturation, this.lightness);
    }
  }, 

  toString: function() {
    return "hsla(" + this.hue + ", " + this.saturation + "%, " + this.lightness + "%, " + this.alpha + ")";
  }
};

var colorConverter = new ColorConverter();

function ColorParser() {
}

ColorParser.prototype = {
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
  }, 
  
  componentParsers: {red: parseInt, green: parseInt, blue: parseInt, alpha: parseFloat, 
                     hue: parseInt, saturation: parseInt, lightness: parseInt, name: toString}, 
  
  parseComponent: function(label, value) {
    return this.componentParsers[label](value);
  }
};


/** These functions are extracted from
 
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
    var r = rgb[0]/255,
    g = rgb[1]/255,
    b = rgb[2]/255,
    min = Math.min(r, g, b),
    max = Math.max(r, g, b),
    delta = max - min,
    h, s, l;

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

  cssKeywords: {
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

