// state
var mouseMoveCounter = 0;
var useMouse = false;
var w = 1300;
var h = 1000;
var cursorOffsetX = 8;
var cursorOffsetY = 8;

// DOM
var textureCanvas1;
var textureCanvas2;
var save;
var clear;
var plugin;
var cursor;

window.onload = function() {
  initDOMElements();
  initEvents();
  // load module
  sketcherA = new Ploma.Sketcher(canvas, textureCanvas1, textureCanvas2);
  clearCanvas();
}

// ------------------------------------------
// initDOMElements
//
// Initializes DOM elements.
//
function initDOMElements() {
  canvas = document.getElementById('canvas');
  canvas.setAttribute('width', w);
  canvas.setAttribute('height', h);
  save = document.getElementById('save');
  clear = document.getElementById('clear');
  cursor = document.getElementById('cursor');
  texture1 = document.getElementById("texture1");
  texture2 = document.getElementById("texture2");
  textureCanvas1 = document.getElementById("texture-canvas-1");
  textureCanvas2 = document.getElementById("texture-canvas-2");
  plugin = document.getElementById('wtPlugin');

  // prepare textures
  textureCanvas1.width = texture1.width;
  textureCanvas1.height = texture1.height;
  textureCanvas1.getContext('2d').drawImage(texture1, 0, 0, texture1.width, texture1.height);

  textureCanvas2.width = texture2.width;
  textureCanvas2.height = texture2.height;
  textureCanvas2.getContext('2d').drawImage(texture2, 0, 0, texture2.width, texture2.height);

  // If pen is not detected at startup
  // assume that we're using a mouse
  // TODO: check and test thoroughly
  //if (!plugin.penAPI || !plugin.penAPI.pressure) {
  //  useMouse = true;
  //  mouse.checked = true;
  //}
}

// ------------------------------------------
// initEvents
//
// Initializes DOM events.
//
function initEvents() {
  save.onclick = function(e) {
    window.open(canvas.toDataURL());
  }
  clear.onclick = function(e) {
    clearCanvas();
  }
  cursor.onclick = function(e) {
    if(cursor.checked) {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'none';
    }
  }
  mouse.onclick = function(e) {
    useMouse = mouse.checked;
  }
  canvas.onmousedown = function(e) {
    var point = getEventPoint(e)
    sketcherA.beginStroke(point.x, point.y, point.p);
  }
  canvas.onmousemove = function(e) {
    mouseMoveCounter++;

    if (mouseMoveCounter % 2 !== 0) {
      var point = getEventPoint(e)
      sketcherA.addPoint(point.x, point.y, point.p);
    }
  }
  canvas.onmouseup = function(e) {
    var point = getEventPoint(e);
    sketcherA.finishStroke(point.x, point.y, point.p);
  }
}

// ------------------------------------------
// getEventPoint
//
// Get the client location data plus pressure
// input from the tablet plugin, or 1 for
// pressure if using the mouse for input.
//
function getEventPoint(e) {
  return {
    x: e.clientX - cursorOffsetX + document.getElementsByTagName('body')[0].scrollLeft,
    y: e.clientY - cursorOffsetY + document.getElementsByTagName('body')[0].scrollTop,
    p: (useMouse ? 1: plugin.penAPI.pressure)
  }
}

// ------------------------------------------
// clearCanvas
//
// Uses the ploma clearCanvas interface
//
function clearCanvas(){
  sketcher.clear();
}

