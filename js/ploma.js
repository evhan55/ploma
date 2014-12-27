/*
Ploma - High-fidelity ballpoint pen rendering for Wacom Cintiq 13HD
v0.3

Evelyn Eastmond - evhan55@gmail.com
Communications Design Group, SAP

Dan Amelang
Viewpoints Research Institute

(c) 2014

TODO: License
*/

var Ploma = function(canvas, textureCanvas) {

  // DOM
  var canvas = canvas;
  var w = canvas.getAttribute('width');
  var h = canvas.getAttribute('height');
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, w, h);
  var textureCanvas = textureCanvas;
  var textureImageData = textureCanvas.getContext('2d').getImageData(0, 0, textureCanvas.width, textureCanvas.height).data;
  var paperColor = 'rgb(255, 255, 255)';

  // State
  var rawInputStrokes = [];
  var curRawInputStroke = [];
  var filteredStrokes = [];
  var curFilteredStroke = [];
  var pointCounter = 0;
  var minx = null;
  var maxx = null;
  var miny = null;
  var maxy = null;
  var lastControlPoint = null;
  var filterWeight = 50;
  var textureOffsetX = 0;
  var textureOffsetY = 0;
  var stepOffset = 0;
  var stepInterval = 0.30;
  var isDrawing = false;

  //////////////////////////////////////////////
  // PUBLIC
  //////////////////////////////////////////////

  // ------------------------------------------
  // strokes
  //
  // Returns an array of all strokes that have
  // been recorded, each stroke itself is an
  // array of point data objects.
  //
  this.strokes = function() {
    var strokes = [];
    for(var i = 0; i < filteredStrokes.length; i++){
      var stroke = [];
      strokes.push(stroke);
      for(var j = 0; j < filteredStrokes[i].length; j++) {
        stroke.push(filteredStrokes[i][j].asObj());
      }
    }
    return strokes;
  };

  // ------------------------------------------
  // curStroke
  //
  // Returns the current stroke of points that
  // have been stored since the last mouse down
  // as an array of point data objects.
  //
  this.curStroke = function() {
    var curStroke = [];
    for(var i = 0; i < curFilteredStroke.length; i++) {
      curStroke.push(curFilteredStroke[i].asObj());
    }
    return curStroke;
  };

  // ------------------------------------------
  // clear
  //
  // Clears the canvas to paperColor in given
  // width and height.
  //
  this.clear = function() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = paperColor;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, w, h);
    imageData = ctx.getImageData(0, 0, w, h);
  };

  // ------------------------------------------
  // beginStroke
  //
  // Appends a new stroke array containing point
  //
  this.beginStroke = function(x,y,p) {
    stepOffset = stepInterval;
    var point = new Point(x,y,p);
    curRawInputStroke = [point];
    rawInputStrokes.push(curRawInputStroke);

    curFilteredStroke.length = 0; // to expose properly
    curFilteredStroke.push(point);
    filteredStrokes.push(curFilteredStroke);
    isDrawing = true;
  }

  // ------------------------------------------
  // extendStroke
  //
  // Appends the filtered point to the last
  // stroke array.
  //
  this.extendStroke = function(x,y,p) {
    pointCounter++;
    if (!isDrawing) return;

    // Skip every other point for curves
    if (pointCounter % 2 !== 0) {

      // Ignore duplicates in the same stroke
      var point = new Point(x,y,p);
      if(curRawInputStroke.last().equals(point)) {
        return;
      }
      // Push current point
      curRawInputStroke.push(point);

      // Filter inputs
      var fpoint = filterPoint(point);
      if(fpoint) {
        curFilteredStroke.push(fpoint);
      }

      redraw();
    }
  }

  // ------------------------------------------
  // endStroke
  //
  // Appends point to the current stroke array.
  //
  this.endStroke = function(x,y,p) {
    // Keep the last point as is for now
    // TODO: Try to address the "tapering on mouseup" issue
    var point = new Point(x,y,p);
    curRawInputStroke.push(point);
    curFilteredStroke.push(point);

    redraw();
    lastControlPoint = null;
    isDrawing = false;
  }

  //////////////////////////////////////////////
  // PRIVATE
  //////////////////////////////////////////////

  // ------------------------------------------
  // redraw
  //
  // Calls the curve drawing function if there
  // are enough points for a bezier.
  //
  function redraw() {
    // TODO: Handle single point and double point strokes
    // 3 points needed for a look-ahead bezier
    if (!isDrawing) return;

    if(curFilteredStroke.length >= 3) {
      var len = curFilteredStroke.length;
      createAndDrawBezier([
        curFilteredStroke[len - 3],
        curFilteredStroke[len - 2],
        curFilteredStroke[len - 1]
      ]);
    }
  };

  // ------------------------------------------
  // filterPoint
  //
  // Calls calculateFilteredPoints if enough
  // points are stored in curRawInputStroke.
  //
  function filterPoint(point) {
    var len = curRawInputStroke.length;
    var fpoint = calculateFilteredPoint(
      curRawInputStroke[len - 3],
      curRawInputStroke[len - 2],
      curRawInputStroke[len - 1]
    );
    return fpoint
  }

  // ------------------------------------------
  // createAndDrawBezier
  //
  // Draw a look-ahead cubic bezier based on 3
  // input points.
  //
  function createAndDrawBezier(pts) {
    minx = w;
    miny = h;
    maxx = 0;
    maxy = 0;

    // Endpoints and control points
    var p0 = pts[0];
    var p3 = pts[1];
    var p1;
    var p2;

    // Calculate p1
    if(!lastControlPoint) {
      p1 = new Point(
        p0.x + (p3.x - p0.x) * 0.33,
        p0.y + (p3.y - p0.y) * 0.33,
        p0.p + (p3.p - p0.p) * 0.33
      );
    } else {
      p1 = lastControlPoint.getMirroredPt(p0);
    }

    // Calculate p2
    if (pts[2]) {
      p2 = new Point(
        p3.x - (((p3.x - p0.x) + (pts[2].x - p3.x)) / 2 / 3),
        p3.y - (((p3.y - p0.y) + (pts[2].y - p3.y)) / 2 / 3),
        p3.p - (((p3.p - p0.p) + (pts[2].p - p3.p)) / 2 / 3)
      );
    } else {
      p2 = new Point(
        p0.x + (p3.x - p0.x) * 0.66,
        p0.y + (p3.y - p0.y) * 0.66,
        p0.p + (p3.p - p0.p) * 0.66
      );
    }

    // Set last control point
    lastControlPoint = p2;

    // Step along curve
    var stepPoints = calculateStepPoints(p0, p1, p2, p3);
    for(var i = 0; i < stepPoints.length; i++) {
      drawStep(imageData, stepPoints[i]);
    }

    // Put image using a crude dirty rect
    ctx.putImageData(imageData, 0, 0, minx, miny, maxx - minx + 10, maxy - miny + 10);
  }

  // ------------------------------------------
  // calculateStepPoints
  //
  // Calculates even steps along a bezier with
  // control points (p0, p1, p2, p3).
  //
  function calculateStepPoints(p0, p1, p2, p3) {
    var stepPoints = [];
    var i = stepInterval;

    // Algebraic conveniences, not geometric
    var A_x = p3.x - 3 * p2.x + 3 * p1.x - p0.x;
    var A_y = p3.y - 3 * p2.y + 3 * p1.y - p0.y;
    var A_p = p3.p - 3 * p2.p + 3 * p1.p - p0.p;
    var B_x = 3 * p2.x - 6 * p1.x + 3 * p0.x;
    var B_y = 3 * p2.y - 6 * p1.y + 3 * p0.y;
    var B_p = 3 * p2.p - 6 * p1.p + 3 * p0.p;
    var C_x = 3 * p1.x - 3 * p0.x;
    var C_y = 3 * p1.y - 3 * p0.y;
    var C_p = 3 * p1.p - 3 * p0.p;

    var t = (i - stepOffset) / Math.sqrt(C_x * C_x + C_y * C_y);

    while (t <= 1.0) {
      // Point
      var step_x = t * (t * (t * A_x + B_x) + C_x) + p0.x;
      var step_y = t * (t * (t * A_y + B_y) + C_y) + p0.y;
      var step_p = t * (t * (t * A_p + B_p) + C_p) + p0.p;
      stepPoints.push(new Point(
        step_x,
        step_y,
        step_p
      ));

      // Step distance until next one
      var s_x = t * (t * 3 * A_x + 2 * B_x) + C_x; // dx/dt
      var s_y = t * (t * 3 * A_y + 2 * B_y) + C_y; // dy/dt
      var s = Math.sqrt(s_x * s_x + s_y * s_y); // s = derivative in 2D space
      var dt = i / s; // i = interval / derivative in 2D
      t = t + dt;
    }

    // TODO: Maybe later use a better approximation for distance along the bezier?
    if (stepPoints.length == 0) // We didn't step at all along this Bezier
      stepOffset = stepOffset + p0.getDistance(p3);
    else
      stepOffset = stepPoints.last().getDistance(p3);

    return stepPoints;
  }

  // ------------------------------------------
  // calculateFilteredPoint
  //
  // Returns a filtered, sanitized version of 
  // point p2 between points p1 and p3.
  //
  function calculateFilteredPoint(p1, p2, p3) {
    var w = filterWeight / 100;
    if (p1 == null || p2 == null || p3 == null)
      return null; // Not enough points yet to filter
    var m = p1.getMidPt(p3);
    return new Point(
      w * p2.x + (1 - w) * m.x,
      w * p2.y + (1 - w) * m.y,
      w * p2.p + (1 - w) * m.p
    );
  }

  // ------------------------------------------
  // calculateWidth
  //
  // Calculates a non-linear width offset in
  // the range [-2, 1] based on pressure.
  //
  function calculateWidth(p) {
    var width;
    //console.log(p);

    if(p < 0) { // Possible output from bezier
      width = -2;
    }
    if(p < 0.4) {
      width = map(p, 0, 0.4, -2, 0.2);
    } 
    if((p >= 0.4) && (p < 0.45)) {
      width = map(p, 0.4, 0.45, 0.2, 0.25);
    }
    if((p >= 0.45) && (p < 0.8)) {
      width = map(p, 0.45, 0.8, 0.25, 0.50);
    }
    if((p >= 0.8) && (p < 0.95)) {
      width = map(p, 0.8, 0.95, 0.7, 0.9);
    }
    if((p >= 0.95) && (p <= 1)) {
      width = map(p, 0.95, 0.99, 0.9, 0.95);
    }
    if(p > 1) { // Possible output from bezier
      width = 1.2;
    }

    return width;
  }

  // ------------------------------------------
  // drawStep
  //
  // Draws a 5x5 pixel grid at a step point
  // with proper antialiasing and texture.
  //
  function drawStep(id, point) {
    var width = calculateWidth(point.p);

    for(var i = Math.round(point.x) - 2; i < Math.round(point.x) + 3; i++) {
      for(var j = Math.round(point.y) - 2; j < Math.round(point.y) + 3; j++) {

        // Update bounding rect
        minx = Math.min(minx, i);
        maxx = Math.max(maxx, i);
        miny = Math.min(miny, j);
        maxy = Math.max(maxy, j);

        // Distance
        var dist = point.getDistance(new Point(i, j));

        // Antialiasing
        var a = 0.1/(dist - width) - 0.06;

        // Spike
        if(dist < width) {
          a = 1;
        }
        
        // Clamp alpha
        if (a < 0) a = 0;
        if (a >= 1) a = 1;

        // Lighten for heavy touches
        if ( a === 1 && point.p > 0.6) {
           a = 0.3;
        }

        // Get texture for alpha
        var l = getNextTexturePixel(point.p);
        a = a * l;

        // Color
        var r = 20;
        var g = 20;
        var b = 45;

        // Byte-index pixel placement within array
        // Alpha blending: old * (1 - a) + new * a
        var idx = (i + j * w) * 4;
        id.data[idx + 0] = id.data[idx + 0] * (1 - a) + r * a;
        id.data[idx + 1] = id.data[idx + 1] * (1 - a) + g * a;
        id.data[idx + 2] = id.data[idx + 2] * (1 - a) + b * a;
        id.data[idx + 3] = 255;
      }
    }
  }

  // ------------------------------------------
  // getNextTexturePixel
  //
  // Get a brightness value at a pixel location
  // by meandering around an infinitely
  // mirrored and tiled texture.
  // 
  function getNextTexturePixel(p) {

    // Get normalized pixel within texture
    var T_s = textureOffsetX / (texture.width - 1);
    var T_t = textureOffsetY / (texture.height - 1);
    var s = Math.abs(Math.abs(T_s - 1) % 2 - 1);
    var t = Math.abs(Math.abs(T_t - 1) % 2 - 1);
    var x = Math.floor(s * (texture.width - 1));
    var y = Math.floor(t * (texture.height - 1));
    var idx = (x + y * texture.width) * 4;
    var r = textureImageData[idx + 0];
    var g = textureImageData[idx + 1];
    var b = textureImageData[idx + 2];
    var l = (r + g + b) / 3; // crude average luminance

    // Lighter texture for grain at light touches
    if(p < 0.2) {
      l += 50; 
    }

    // Step texture offset randomly [-1, 1]
    var textureStep = getTextureStep();
    textureOffsetX += textureStep.x;
    textureOffsetY += textureStep.y;

    return (1 - l/255);
  }

  // ------------------------------------------
  // getTextureStep
  //
  // Get a random x,y integer offset in the
  // range [-1,1].
  // 
  function getTextureStep() {
    var offset = {
      x: Math.floor(Math.random() * 2) === 1 ? -1 : 1,
      y: Math.floor(Math.random() * 2) === 1 ? -1 : 1,
    }
    return offset;
  }

  // Private objects for Ploma module

  // ------------------------------------------
  // Point.prototype
  //
  // x - x coordinate
  // y - y coordinate
  // p - pressure
  //
  function Point(x, y, p) {
    this.x = x;
    this.y = y;
    this.p = p;
  }

  Point.prototype.equals = function(pt) {
    return pt && this.x === pt.x && this.y === pt.y && this.p === pt.p;
  }

  Point.prototype.getMidPt = function(pt) {
    return new Point(
      (this.x + pt.x) / 2,
      (this.y + pt.y) / 2,
      (this.p + pt.p) / 2
    );
  }

  Point.prototype.getMirroredPt = function(pt) {
    return new Point(
      this.x + 2 * (pt.x - this.x),
      this.y + 2 * (pt.y - this.y),
      this.p + 2 * (pt.p - this.p)
    );
  }

  Point.prototype.getDistance = function(pt) {
    // TODO: use Manhattan distance?
    var dx = this.x - pt.x;
    var dy = this.y - pt.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  Point.prototype.asArray = function() {
    return [this.x, this.y, this.p];
  }

  Point.prototype.asObj = function() {
    return {
      x: this.x,
      y: this.y,
      p: this.p
    };
  }

  // ------------------------------------------
  // UTILITIES
  //
  Array.prototype.last = function(){
    return this[this.length - 1];
  }

  function map(value, valueMin, valueMax, from, to) {
    var ratio = (value - valueMin) / (valueMax - valueMin);
    return from + ratio * (to - from);
  }

}