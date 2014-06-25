var canvas;
var w = 1300;
var h = 1000;
var ratio = 2;
var ctx;
var img;
var img2;
var img3;
var pat;
var pat2;
var pat3;
var paperColor = "rgb(253, 253, 240)";
var paperColor = "rgb(255, 255, 253)";
var paperColor = "rgb(255, 250, 220)";
//var paperColor = "rgb(255, 255, 255)";
var capture;

var curveFitting = 'hybrid-drawing';
var tension;
var sample = 2;
var thickness;
var darkness;
var blur;
var shadowDarkness;
var pressure;

var redrawButton;

var noneInput;
var splineInput;
var bezier2Input;
var hybridInput;
var hybridWritingInput;
var hybridDrawingInput;

var tensionInput;
var sampleInput;
var thicknessInput;
var darknessInput;
var blurInput;
var shadowDarknessInput;
var pressureInput;

var tensionReadout;
var sampleReadout;
var thicknessReadout;
var darknessReadout;
var blurReadout;
var shadowDarknessReadout;
var pressureReadout;

// *********************************************************************
// window.onload
//   Sets the canvas context, loads the JSON capture data and binds
//   events to the GUI controllers in the control panel.
//
window.onload = function(){
  canvas = document.getElementById('canvas');
  img = document.getElementById("img");
  img2 = document.getElementById("img2");
  img3 = document.getElementById("img3");
  ctx = canvas.getContext('2d');
  pat = ctx.createPattern(img,"repeat");
  pat2 = ctx.createPattern(img2, "repeat");
  pat3 = ctx.createPattern(img3, "repeat");
  ctx.strokeStyle = pat;
  //canvas.setAttribute('width', w);
  //canvas.setAttribute('height', h);
  canvas.setAttribute('width', w * ratio);
  canvas.setAttribute('height', h * ratio);
  canvas.style.width = w;
  canvas.style.height = h;
  ctx.scale(ratio, ratio);

  // load capture file points
  capture = JSON.parse(jsonstr);

  redrawButton = document.getElementById('redraw-button');
  redrawButton.onclick = function(e) {
    redraw();
  }

  // tension input
  tensionInput = document.getElementById('tension-input');
  tensionReadout = document.getElementById('tension-readout');
  tension = tensionInput.value;
  tensionReadout.innerHTML = tension;
  tensionInput.oninput = function(e) {
    tension = tensionInput.value;
    tensionReadout.innerHTML = tension;
    //redraw();
  }

  // sample input
  sampleInput = document.getElementById('sample-input');
  sampleReadout = document.getElementById('sample-readout');
  sample = sampleInput.value;
  sampleReadout.innerHTML = sample;
  sampleInput.oninput = function(e) {
    sample = sampleInput.value;
    sampleReadout.innerHTML = sample;
    redraw();
  }

  // thickness input
  thicknessInput = document.getElementById('thickness-input');
  thicknessReadout = document.getElementById('thickness-readout');
  thickness = thicknessInput.value;
  thicknessReadout.innerHTML = thickness;
  thicknessInput.oninput = function(e) {
    thickness = thicknessInput.value;
    thicknessReadout.innerHTML = thickness;
    //redraw();
  }

  // darkness input
  darknessInput = document.getElementById('darkness-input');
  darknessReadout = document.getElementById('darkness-readout');
  darkness = darknessInput.value;
  darknessReadout.innerHTML = darkness;
  darknessInput.oninput = function(e) {
    darkness = darknessInput.value;
    darknessReadout.innerHTML = darkness;
    //redraw();
  }

  // pressure input
  pressureInput = document.getElementById('pressure-input');
  pressureReadout = document.getElementById('pressure-readout');
  pressure = pressureInput.value;
  pressureReadout.innerHTML = pressure;
  pressureInput.oninput = function(e) {
    pressure = pressureInput.value;
    pressureReadout.innerHTML = pressure;
    //redraw();
  }

  // curve fitting input - none
  noneInput = document.getElementById('none-input');
  noneInput.onchange = function(e) {
    if(noneInput.checked) {
      curveFitting = 'none';
    }
    redraw();
  }

  // curve fitting input - spline
  splineInput = document.getElementById('spline-input');
  splineInput.onchange = function(e) {
    if(splineInput.checked) {
      curveFitting = 'spline';
    }
    redraw();
  }

  // curve fitting input - bezier 2
  bezier2Input = document.getElementById('bezier2-input');
  bezier2Input.onchange = function(e) {
    if(bezier2Input.checked) {
      curveFitting = 'bezier2';
    }
    redraw();
  }

  //curve fitting input - hybrid
  hybridInput = document.getElementById('hybrid-input');
  hybridInput.onchange = function(e) {
    if(hybridInput.checked) {
      curveFitting = 'hybrid';
    }
    redraw();
  }

  //hybrid none/curve fitting input - hybrid-writing
  hybridWritingInput = document.getElementById('hybrid-writing-input');
  hybridWritingInput.onchange = function(e) {
    if(hybridWritingInput.checked) {
      curveFitting = 'hybrid-writing';
    }
    redraw();
  }

  //hybrid none/curve fitting input - hybrid-drawing
  hybridDrawingInput = document.getElementById('hybrid-drawing-input');
  hybridDrawingInput.onchange = function(e) {
    if(hybridDrawingInput.checked) {
      curveFitting = 'hybrid-drawing';
    }
    redraw();
  }

  // draw curves with default control values
  hybridDrawingInput.checked = true;
  //noneInput.changed;
  redraw();
}

//**********************************************************************
// window.onkeypress
//   'i' to save out image
//   'c' to clear canvas
//   'j' saves points to json blob
//
window.onkeypress = function(e) {
  if (e.charCode === 99) {
    clearCanvas();
    curves.length = 0;
  }
  if (e.charCode === 105) {
    window.open(canvas.toDataURL());
  }
  if (e.charCode === 106) {
    var json = JSON.stringify(curves);
    var blob = new Blob([json], {type: 'application/json'});
    var url  = URL.createObjectURL(blob);
    window.open(url);
  }
}

// *********************************************************************
// pressureSensitivity
//   Remap pressure value based on sensitivity input between 0 and 1.
//
function mapPressure(p) {
  var result = 1 - pressure*(1 - p);
  return result;
}

// *********************************************************************
// clearCanvas
//   Clears the canvas and fills it with the paper color.
//
function clearCanvas() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = paperColor;
  ctx.globalAlpha = 1;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// *********************************************************************
// redraw
//   Clears the canvas ....
//
//
function redraw() {
  clearCanvas();

  if(curveFitting === 'none') {
    redrawNone();
  }

  if(curveFitting === 'spline') {
    redrawSpline();
  }

  if(curveFitting === 'bezier2') {
    redrawBezier2();
  }

  if(curveFitting === 'hybrid') {
    redrawHybrid();
  }

  if(curveFitting === 'hybrid-writing') {
    redrawHybridWriting();
  }

  if(curveFitting === 'hybrid-drawing') {
    redrawHybridDrawing();
  }
}

function getMinPt(x1, y1, x2, y2, x3, y3, x4, y4) {
  var minx = Math.min(x1, x2, x3, x4) + Math.random()*50;
  var miny = Math.min(y1, y2, y3, y4) + Math.random()*50;

  return {x: minx, y: miny};
}

function getCurveArea(c) {
  var minX = c[0].canvasX;
  var minY = c[0].canvasY;
  var maxX = c[0].canvasX;
  var maxY = c[0].canvasY;
  var area;

  for(var i = 0; i < c.length; i++) {
    minX = Math.min(minX, c[i].canvasX);
    minY = Math.min(minY, c[i].canvasY);
    maxX = Math.max(maxX, c[i].canvasX);
    maxY = Math.max(maxY, c[i].canvasY);
  }

  area = (maxX - minX)*(maxY - minY);

  return area;
}

function getSampledCurve(c, s) {
  var sampledCurve = [];
  for (var i = 0; i < c.length; i++) {
    if(i%s === 0) {
      sampledCurve.push(c[i]);
    }
    // always keep the last point
    if(i === c.length-1) {
      sampledCurve.push(c[i]);
    }
  }
  return sampledCurve;
}

//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
/**
 * Decimal adjustment of a number.
 *
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number}      The adjusted value.
 */
function decimalAdjust(type, value, exp) {
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math[type](value);
  }
  value = +value;
  exp = +exp;
  // If the value is not a number or the exp is not an integer...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // Shift
  value = value.toString().split('e');
  value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}