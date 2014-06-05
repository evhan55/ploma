var canvas;
var ctx;
var img;
var img2;
var img3;
var pat;
var pat2;
var pat3;
var paperColor = "rgb(253, 253, 240)";
var paperColor = "rgb(255, 255, 245)";
var paperColor = "rgb(255, 253, 230)";
var capture;

var curveFitting = 'hybrid2';
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
var hybrid2Input;

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

  //curve fitting input - hybrid2
  hybrid2Input = document.getElementById('hybrid2-input');
  hybrid2Input.onchange = function(e) {
    if(hybrid2Input.checked) {
      curveFitting = 'hybrid2';
    }
    redraw();
  }

  // draw curves with default control values
  hybrid2Input.checked = true;
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

  if(curveFitting === 'hybrid2') {
    redrawHybrid2();
  }
}

function getMinPt(x1, y1, x2, y2, x3, y3, x4, y4) {
  var minx = Math.min(x1, x2, x3, x4) + Math.random()*50;
  var miny = Math.min(y1, y2, y3, y4) + Math.random()*50;

  return {x: minx, y: miny};
}