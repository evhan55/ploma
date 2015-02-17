/*
Ploma - High-fidelity ballpoint pen rendering for tablets with pressure-sensitive styluses
v0.4

Evelyn Eastmond
Dan Amelang
Viewpoints Research Institute

(c) 2014-2015

TODO: License
*/

"use strict"; // for strict mode

// ------------------------------------------
// Ploma
//
// Constructor for Ploma instances. Accepts
// an HTML <canvas> Element element to render
// strokes onto.
//
var Ploma = function(canvas) {

  //////////////////////////////////////////////
  // PUBLIC
  //////////////////////////////////////////////

  // ------------------------------------------
  // clear
  //
  // Clears the canvas.
  //
  this.clear = function() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = paperColor;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, w, h);
    imageData = ctx.getImageData(0, 0, w, h);
    imageDataData = imageData.data;
  };

  // ------------------------------------------
  // beginStroke
  //
  // Begins a new stroke containing the given
  // point x, y and p (pressure ranging from
  // 0-1) values.
  //
  this.beginStroke = function(x, y, p) {
    var point = new Point(x,y,p);
    //pointCounter++;

    curRawStroke = [point];
    rawStrokes.push(curRawStroke);
    curFilteredStroke = [point]
    filteredStrokes.push(curFilteredStroke);
    //curRawSampledStroke = [point];

    // Get the latest canvas pixels in case they've changed
    // since the last stroke
    imageData = ctx.getImageData(0, 0, w, h);
    imageDataData = imageData.data;

    // Reset step offset for new stroke
    stepOffset = stepInterval;
  }

  // ------------------------------------------
  // extendStroke
  //
  // Extends the current stroke with the given
  // point and renders the new stroke segment
  // to the canvas.
  //
  this.extendStroke = function(x, y, p) {
    //pointCounter++;

    var point = new Point(x,y,p);

    //
    // Raw
    //
    //if(curRawStroke.last().equals(point)) {
      //return; // ignore dupes TODO: ??
    //}
    curRawStroke.push(point);

    //
    // Sampled and filtered
    //
    //if (pointCounter % sample !== 0) {

      // Push sampled point
      //if(curRawSampledStroke.last().equals(point)) {
        //return; // ignore dupes TODO: ??
      //}
      curRawStroke.push(point);

      // Filter next-to-last input point
      var len = curRawStroke.length;
      if(len >= 3) {
        var fpoint = calculateFilteredPoint(
          curRawStroke[len - 3],
          curRawStroke[len - 2],
          curRawStroke[len - 1]
        );
        if(fpoint) {
          // Push sampled, filtered, point
          curFilteredStroke.push(fpoint);
        }
      }

      // Redraw sampled and filtered
      redraw();
    //}

  }

  // ------------------------------------------
  // endStroke
  //
  // Ends the current stroke with the given
  // point and renders the final stroke segment
  // to the canvas.
  //
  this.endStroke = function(x, y, p) {
    var point = new Point(x,y,p);

    // Keep the last point as is for now
    // TODO: Try to address the "tapering on mouseup" issue
    curRawStroke.push(point);
    //curRawSampledStroke.push(point);
    curFilteredStroke.push(point);

    redraw();
    lastControlPoint = null;
  }

  // ------------------------------------------
  // strokes
  //
  // Returns an array of all strokes that have
  // been recorded, each stroke itself is an
  // array of point JSON objects.
  //
  // [
  //   [{x, y, p}, {x, y, p}, ...],
  //   [{x, y, p}, {x, y, p}, ...],
  //   ...
  // ]
  //
  this.strokes = function() {
    var strokes = [];
    for(var i = 0; i < rawStrokes.length; i++){
      var stroke = [];
      strokes.push(stroke);
      for(var j = 0; j < rawStrokes[i].length; j++) {
        stroke.push(rawStrokes[i][j].asObj());
      }
    }
    return strokes;
  };

  // ------------------------------------------
  // curStroke
  //
  // Returns the current stroke of points that
  // have been stored since the last mouse down
  // as an array of point JSON objects.
  //
  // [{x, y, p}, {x, y, p}, ...]
  //
  this.curStroke = function() {
    var curStroke = [];
    for(var i = 0; i < curRawStroke.length; i++) {
      curStroke.push(curRawStroke[i].asObj());
    }
    return curStroke;
  };

  //////////////////////////////////////////////
  // PRIVATE
  //////////////////////////////////////////////

  // DOM
  var canvas = canvas;
  var w = canvas.getAttribute('width');
  var h = canvas.getAttribute('height');
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, w, h);
  var imageDataData = new Uint8ClampedArray(w*h);
  imageDataData = ctx.getImageData(0, 0, w, h).data;
  var paperColor = 'rgb(255, 255, 255)';

  // State
  var rawStrokes = [];
  var curRawStroke = [];
  //var curRawSampledStroke = [];
  var filteredStrokes = [];
  var curFilteredStroke = [];
  var minx = 0.0;
  var maxx = 0.0;
  var miny = 0.0;
  var maxy = 0.0;
  var textureSampleStep = 0;
  var lastControlPoint = null;
  var filterWeight = 0.5;
  var filterWeightInverse = 1 - filterWeight;
  var stepOffset = 0.0;
  var stepInterval = 0.30;
  var penR = 20;
  var penG = 20;
  var penB = 45;
  //var pointCounter = 0;
  //var sample = 2;

  // Generate Texture Samples
  var textureImage = getImageFromBase64(textureBase64());
  var textureSamples = new Uint8ClampedArray(1e4);
  getSamplesFromImage(textureImage, textureSamples);

  // ------------------------------------------
  // redraw
  //
  // Calls the curve drawing function if there
  // are enough points for a bezier.
  //
  function redraw() {
    // TODO:
    // - Handle single point and double point strokes

    // 3 points needed for a look-ahead bezier
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
  // createAndDrawBezier
  //
  // Draw a look-ahead cubic bezier based on 3
  // input points.
  //
  function createAndDrawBezier(pts) {
    // Endpoints and control points
    var p0 = pts[0];
    var p0_x = p0.x;
    var p0_y = p0.y;
    var p0_p = p0.p;

    var p3 = pts[1];
    var p3_x = p3.x;
    var p3_y = p3.y;
    var p3_p = p3.p;

    var p1;
    var p2;

    // Calculate p1
    if(!lastControlPoint) {
      p1 = new Point(
        p0_x + (p3_x - p0_x) * 0.33,
        p0_y + (p3_y - p0_y) * 0.33,
        p0_p + (p3_p - p0_p) * 0.33
      );
    } else {
      p1 = lastControlPoint.getMirroredPt(p0);
    }

    // Calculate p2
    if (pts[2]) {
      p2 = new Point(
        p3_x - (((p3_x - p0_x) + (pts[2].x - p3_x)) / 6),
        p3_y - (((p3_y - p0_y) + (pts[2].y - p3_y)) / 6),
        p3_p - (((p3_p - p0_p) + (pts[2].p - p3_p)) / 6)
        //p3_x - (((p3_x - p0_x) + (pts[2].x - p3_x)) * 0.166),
        //p3_y - (((p3_y - p0_y) + (pts[2].y - p3_y)) * 0.166),
        //p3_p - (((p3_p - p0_p) + (pts[2].p - p3_p)) * 0.166)
      );
    } else {
      p2 = new Point(
        p0_x + (p3_x - p0_x) * 0.66,
        p0_y + (p3_y - p0_y) * 0.66,
        p0_p + (p3_p - p0_p) * 0.66
      );
    }

    // Set last control point
    lastControlPoint = p2;

    // Step along curve
    var stepPoints = calculateStepPoints(p0, p1, p2, p3);
    for(var i = 0; i < stepPoints.length; i++) {
      drawStep(imageDataData, stepPoints[i]);
    }

    // Access point objects now
    var p1_x = p1.x;
    var p1_y = p1.y;
    var p2_x = p2.x;
    var p2_y = p2.y;

    // Calculate redraw bounds
    // TODO:
    // - Math.min = x <=y ? x : y; INLINE
    minx = Math.min(p0_x, p1_x, p2_x, p3_x);
    miny = Math.min(p0_y, p1_y, p2_y, p3_y);
    maxx = Math.max(p0_x, p1_x, p2_x, p3_x);
    maxy = Math.max(p0_y, p1_y, p2_y, p3_y);

    // Put image using a crude dirty rect
    ctx.putImageData(
      imageData,
      0,
      0,
      minx - 5,
      miny - 5,
      (maxx - minx) + 10,
      (maxy - miny) + 10
    );
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

    // TODO: Maybe use a better approximation for distance along the bezier?
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
    if (p1 == null || p2 == null || p3 == null)
      return null; // Not enough points yet to filter

    var m = p1.getMidPt(p3);

    return new Point(
      filterWeight * p2.x + filterWeightInverse * m.x,
      filterWeight * p2.y + filterWeightInverse * m.y,
      filterWeight * p2.p + filterWeightInverse * m.p
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
      width = 1;
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

    /////////////////////
    // PRE-LOOP
    /////////////////////

    var width = 0.0;
    var l = 0.0;

    width = calculateWidth(point.p);

    // Pre-find texture sample
    if(textureSampleStep >= textureSamples.length) {
      textureSampleStep = 0;
    }
    l = (textureSamples[textureSampleStep])/255;
    textureSampleStep ++;

    /////////////////////
    // LOOP
    /////////////////////

    var p_x = 0.0;
    var p_y = 0.0;
    var centerX = 0.0;
    var centerY = 0.0;
    var i = 0;
    var j = 0;
    var left = 0;
    var right = 0;
    var top = 0;
    var bottom = 0; 
    var dx = 0.0;
    var dy = 0.0;
    var dist = 0.0;
    var a = 0.0;
    var idx = 0;
    var invA = 0.0;
    var idx_0 = 0;
    var idx_1 = 0;
    var idx_2 = 0;
    var idx_3 = 0;
    var oldR = 0.0;
    var oldG = 0.0;
    var oldB = 0.0;
    var newR = 0.0;
    var newG = 0.0;
    var newB = 0.0;

    p_x = point.x;
    p_y = point.y;
    centerX = Math.round(p_x);
    centerY = Math.round(p_y);
    left = centerX - 2;
    right = centerX + 3;
    top = centerY - 2;
    bottom = centerY + 3;

    for(i = left; i < right; i++) {
      for(j = top; j < bottom; j++) {

        // Distance
        //var dist = Math.abs(dx) + Math.abs(dy);
        dx = p_x - i;
        dy = p_y - j;
        dist = Math.sqrt(dx * dx + dy * dy);

        // Antialiasing
        a = (0.1 / (dist - width)) - 0.06;

        // Spike
        if(dist < width) {
          a = 0.3;
        }
        
        // Clamp alpha
        if (a < 0) a = 0;
        if (a >= 0.3) a = 0.3;

        // Shade alpha by texture
        a = a * l;

        // Byte-index pixel placement within array
        idx = (i + j * w) * 4;

        // Assumes opaque background for blending
        invA = 1 - a;
        idx_0 = idx + 0;
        idx_1 = idx + 1;
        idx_2 = idx + 2;
        oldR = id[idx_0];
        oldG = id[idx_1];
        oldB = id[idx_2];
        newR = penR * a + oldR * invA;
        newG = penG * a + oldG * invA;
        newB = penB * a + oldB * invA;
        id[idx_0] = newR;
        id[idx_1] = newG;
        id[idx_2] = newB;

      }
    }
  }

  // ------------------------------------------
  // POINT
  //
  function Point(x, y, p) {
    this.x = x; // x-coordinate
    this.y = y; // y-coordinate
    this.p = p; // pressure
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
  // UTILS
  //
  Array.prototype.last = function(){
    return this[this.length - 1];
  }

  function map(value, valueMin, valueMax, from, to) {
    var ratio = (value - valueMin) / (valueMax - valueMin);
    return from + ratio * (to - from);
  }

  // ------------------------------------------
  // TEXTURE
  //

  function textureBase64() {
    return "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";
  }

  function getImageFromBase64(base64) {
    var img = new Image();
    img.src = "data:image/jpeg;base64, " + base64;

    return img;
  }

  function getImageDataFromImage(img) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    imageData = ctx.getImageData(0, 0, img.width, img.height).data;

    return imageData;
  }

  function getSamplesFromImage(img, samples) {
    var imageData = getImageDataFromImage(img);
    var imageDataGrays = [];
    var textureOffsetX = 0;
    var textureOffsetY = 0;

    // Read grays from image
    for(var i = 0; i < imageData.length; i+=4) {
      imageDataGrays.push(1 - imageData[i]/255);
    }

    // Read samples from mirrored-and-tiled grays
    for (var i = 0; i < 1e4; i++) {
      // Get normalized pixel within texture
      var T_s = textureOffsetX / (img.width - 1);
      var T_t = textureOffsetY / (img.height - 1);
      var s = Math.abs(Math.abs(T_s - 1) % 2 - 1);
      var t = Math.abs(Math.abs(T_t - 1) % 2 - 1);
      var x = Math.floor(s * (img.width - 1));
      var y = Math.floor(t * (img.height - 1));
      var l = imageDataGrays[x + y * img.width];
      samples[i] = (l*255)|0;
      //samples[i] = 230;
      
      // Step texture offset randomly [-1, 1]
      textureOffsetX += (Math.random() * 2 | 0) === 1 ? -1 : 1;
      textureOffsetY += (Math.random() * 2 | 0) === 1 ? -1 : 1;
    }

    //return samples;
  }

} // Ploma

// ------------------------------------------
// Ploma.getStrokeImageData
//
// Returns image data for the input stroke,
// against a transparent canvas, clipped to
// the stroke's bounds.  Input stroke is to
// be a an array of JSON objects of point
// data:
//
// [{x, y, p}, {x, y, p}, ...]
//
Ploma.getStrokeImageData = function(inputStroke) {
  // Make a local copy
  var stroke = [];
  for(var i = 0; i < inputStroke.length; i++) {
    stroke.push(inputStroke[i]);
  }

  // For drawing and getting image data later
  var canvas = document.createElement('canvas');

  // Precalculate necessary bounds
  var minx = Infinity;
  var miny = Infinity;
  var maxx = 0;
  var maxy = 0;
  for(var i = 0; i < stroke.length; i++) {
    var point = stroke[i];
    minx = Math.min(minx, point.x);
    miny = Math.min(miny, point.y);
    maxx = Math.max(maxx, point.x);
    maxy = Math.max(maxy, point.y);
  }
  var w = maxx - minx + 8;
  var h = maxy - miny + 8;
  canvas.setAttribute('width', Math.ceil(w));
  canvas.setAttribute('height', Math.ceil(h));

  // Shift points to new origin
  for(var i = 0; i < stroke.length; i++) {
    var point = stroke[i];
    point.x = point.x - minx + 4;
    point.y = point.y - miny + 4;
  }

  // Instantiate Ploma on this new canvas
  var ploma = new Ploma(canvas);

  // Draw stroke onto temp canvas
  ploma.beginStroke(
    stroke[0].x,
    stroke[0].y,
    stroke[0].p
  );
  for(var i = 1; i < stroke.length - 1; i++) {
    ploma.extendStroke(
      stroke[i].x,
      stroke[i].y,
      stroke[i].p
    );
  }
  ploma.endStroke(
    stroke[stroke.length - 1].x,
    stroke[stroke.length - 1].y,
    stroke[stroke.length - 1].p
  );

  // Return the image data
  return canvas.getContext('2d').getImageData(0, 0, w, h);
};