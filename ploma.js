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
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = paperColor;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, w, h);
    imageData = ctx.getImageData(0, 0, w, h);
    imageDataData = imageData.data;

    // Reset data
    rawStrokes = [];
    curRawStroke = [];
    curRawSampledStroke = [];
    filteredStrokes = [];
    curFilteredStroke = [];
    minx = 0.0;
    maxx = 0.0;
    miny = 0.0;
    maxy = 0.0;
    lastControlPoint = null;
    stepOffset = 0.0;
    pointCounter = 0;
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
    pointCounter++;

    curRawStroke = [point];
    rawStrokes.push(curRawStroke);
    curFilteredStroke = [point]
    filteredStrokes.push(curFilteredStroke);
    curRawSampledStroke = [point];

    // Get the latest canvas pixels in case
    // they've changed since the last stroke
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
    pointCounter++;
    
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
    if (pointCounter % sample === 0) {

      // Push sampled point
      //if(curRawSampledStroke.last().equals(point)) {
        //return; // ignore dupes TODO: ??
      //}
      curRawSampledStroke.push(point);

      // Filter next-to-last input point
      var len = curRawSampledStroke.length;
      if(len >= 3) {
        var fpoint = calculateFilteredPoint(
          curRawSampledStroke[len - 3],
          curRawSampledStroke[len - 2],
          curRawSampledStroke[len - 1]
        );
        //if(fpoint) {
          // Push sampled, filtered, point
          curFilteredStroke.push(fpoint);
        //}
      }

      // Redraw sampled and filtered
      redraw();
    }
    

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
    curRawSampledStroke.push(point);
    curFilteredStroke.push(point);

    redraw();
    lastControlPoint = null;
    
  }

  // ------------------------------------------
  // getStrokes
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
  this.getStrokes = function() {
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
  // setStrokes
  //
  // Sets the strokes to the input array,
  // expected as:
  //
  // [
  //   [{x, y, p}, {x, y, p}, ...],
  //   [{x, y, p}, {x, y, p}, ...],
  //   ...
  // ]
  //
  this.setStrokes = function(strokes) {
    // Clear and set rendering to false
    this.clear();
    //applyRendering = !applyRendering;

    // Redraw all the strokes
    for(var i = 0; i < strokes.length; i++) {
      var stroke = strokes[i];
      this.beginStroke(
        stroke[0].x,
        stroke[0].y,
        stroke[0].p
      );
      for(var j = 1; j < stroke.length-1; j++) {
        this.extendStroke(
          stroke[j].x,
          stroke[j].y,
          stroke[j].p
        );
      }
      this.endStroke(
        stroke[stroke.length-1].x,
        stroke[stroke.length-1].y,
        stroke[stroke.length-1].p
      );
    }
  }

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

  // ------------------------------------------
  // setSample
  //
  // Sets the input sampling rate.
  //
  this.setSample = function(n) {
    sample = n;
  }

  // ------------------------------------------
  // resize
  //
  // Resize the Ploma instance to a new width
  // and height.
  //
  this.resize = function(a, b) {
    canvas.setAttribute('width', a);
    canvas.setAttribute('height', b);
    w = canvas.getAttribute('width');
    h = canvas.getAttribute('height');
    w_4 = w*4;
    this.clear();
  }

  // ------------------------------------------
  // toggleTexture
  //
  // Set texture on or off, and redraw all the
  // strokes.
  //
  this.toggleTexture = function() {
    // Deep copy the raw strokes
    /*var originalStrokes = this.strokes();
    var capturedRawStrokes = [];
    for(var i = 0; i < originalStrokes.length; i++) {
      capturedRawStrokes.push(originalStrokes[i]);
    }*/

    // Clear and set rendering to false
    //this.clear();
    applyRendering = !applyRendering;

    // Redraw all the strokes
    /*for(var i = 0; i < capturedRawStrokes.length; i++) {
      var stroke = capturedRawStrokes[i];
      this.beginStroke(
        stroke[0].x,
        stroke[0].y,
        stroke[0].p
      );
      for(var j = 1; j < stroke.length-1; j++) {
        this.extendStroke(
          stroke[j].x,
          stroke[j].y,
          stroke[j].p
        );
      }
      this.endStroke(
        stroke[stroke.length-1].x,
        stroke[stroke.length-1].y,
        stroke[stroke.length-1].p
      );
    }*/

  }

  //////////////////////////////////////////////
  // PRIVATE
  //////////////////////////////////////////////

  // DOM
  var canvas = canvas;
  var w = 0;
  var h = 0;
  var w_4 = 0;
  var ctx = canvas.getContext('2d');
  var imageData = null;
  var imageDataData = new Uint8ClampedArray(w * h);
  //var paperColor = 'rgb(240, 235, 219)';
  var paperColor = 'rgb(255, 255, 246)'; // light
  var paperColor = 'rgb(240, 235, 219)'; // dark
  //var paperColor = 'rgb(250, 240, 230)';
  //var paperColor = 'rgb(245, 230, 218)';
  w = canvas.getAttribute('width');
  h = canvas.getAttribute('height');
  w_4 = w * 4;
  ctx.imageSmoothingEnabled = false;
  imageData = ctx.getImageData(0, 0, w, h);
  imageDataData = imageData.data;

  // State
  var rawStrokes = [];
  var curRawStroke = [];
  var curRawSampledStroke = [];
  var filteredStrokes = [];
  var curFilteredStroke = [];
  var minx = 0.0;
  var maxx = 0.0;
  var miny = 0.0;
  var maxy = 0.0;
  var textureSampleStep = 0;
  var textureSamplesLength = 1e5;
  var lastControlPoint = null;
  var filterWeight = 0.5;
  var filterWeightInverse = 1 - filterWeight;
  var stepOffset = 0.0;
  var stepInterval = 0.3;
  var penR = 25;
  var penG = 8;
  var penB = 45;
  var pointCounter = 0;
  var sample = 2;
  var applyRendering = true;

  // Generate Texture Samples
  var textureSampleLocations = [];
  var inkTextureImageDataGrays = [];
  var inkTextureImage = getImageFromBase64(inkTextureBase64(), "jpeg")
  var inkTextureSamples = new Float32Array(textureSamplesLength);
  getSamplesFromImage(inkTextureImage, inkTextureSamples);

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
    var len = curFilteredStroke.length;
    if(len >= 3) {
      createAndDrawBezier(
        curFilteredStroke[len - 3],
        curFilteredStroke[len - 2],
        curFilteredStroke[len - 1]
      );
    }
  };

  // ------------------------------------------
  // createAndDrawBezier
  //
  // Draw a look-ahead cubic bezier based on 3
  // input points.
  //
  function createAndDrawBezier(pt0, pt1, pt2) {
    // Endpoints and control points
    var p0 = pt0;
    var p1 = 0.0;
    var p2 = 0.0;
    var p3 = pt1;

    // Value access
    var p0_x = p0.x;
    var p0_y = p0.y;
    var p0_p = p0.p;
    var p3_x = p3.x;
    var p3_y = p3.y;
    var p3_p = p3.p;

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
    if (pt2) {
      p2 = new Point(
        //p3_x - (((p3_x - p0_x) + (pt2.x - p3_x)) / 6),
        //p3_y - (((p3_y - p0_y) + (pt2.y - p3_y)) / 6),
        //p3_p - (((p3_p - p0_p) + (pt2.p - p3_p)) / 6)
        p3_x - (((p3_x - p0_x) + (pt2.x - p3_x)) * 0.1666),
        p3_y - (((p3_y - p0_y) + (pt2.y - p3_y)) * 0.1666),
        p3_p - (((p3_p - p0_p) + (pt2.p - p3_p)) * 0.1666)
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

    // Step along curve and draw step
    var stepPoints = calculateStepPoints(p0, p1, p2, p3);
    for(var i = 0; i < stepPoints.length; i++) {
      drawStep(imageDataData, stepPoints[i]);
    }

    // Calculate redraw bounds
    // TODO:
    // - Math.min = x <= y ? x : y; INLINE
    var p1_x = p1.x;
    var p1_y = p1.y;
    var p2_x = p2.x;
    var p2_y = p2.y;
    minx = Math.min(p0_x, p1_x, p2_x, p3_x);
    miny = Math.min(p0_y, p1_y, p2_y, p3_y);
    maxx = Math.max(p0_x, p1_x, p2_x, p3_x);
    maxy = Math.max(p0_y, p1_y, p2_y, p3_y);

    // Put image using a crude dirty rect
    //elapsed = Date.now() - elapsed;
    //console.log(elapsed);
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

    // Value access
    var p0_x = p0.x;
    var p0_y = p0.y;
    var p0_p = p0.p;

    // Algebraic conveniences, not geometric
    var A_x = p3.x - 3 * p2.x + 3 * p1.x - p0_x;
    var A_y = p3.y - 3 * p2.y + 3 * p1.y - p0_y;
    var A_p = p3.p - 3 * p2.p + 3 * p1.p - p0_p;
    var B_x = 3 * p2.x - 6 * p1.x + 3 * p0_x;
    var B_y = 3 * p2.y - 6 * p1.y + 3 * p0_y;
    var B_p = 3 * p2.p - 6 * p1.p + 3 * p0_p;
    var C_x = 3 * p1.x - 3 * p0_x;
    var C_y = 3 * p1.y - 3 * p0_y;
    var C_p = 3 * p1.p - 3 * p0_p;

    var t = (i - stepOffset) / Math.sqrt(C_x * C_x + C_y * C_y);

    while (t <= 1.0) {
      // Point
      var step_x = t * (t * (t * A_x + B_x) + C_x) + p0_x;
      var step_y = t * (t * (t * A_y + B_y) + C_y) + p0_y;
      var step_p = t * (t * (t * A_p + B_p) + C_p) + p0_p;
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
    //if (p1 == null || p2 == null || p3 == null)
    //  return null; // Not enough points yet to filter

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
    var width = 0.0;
    //console.log(p);

    if(p < 0) { // Possible output from bezier
      width = -3.50;
    }
    if(p < 0.2) {
      width = map(p, 0, 0.2, -3.50, -3.20);
    } 
    if((p >= 0.2) && (p < 0.45)) {
      width = map(p, 0.2, 0.45, -3.20, -2.50);
    }
    if((p >= 0.45) && (p < 0.8)) {
      width = map(p, 0.45, 0.8, -2.50, -1.70);
    }
    if((p >= 0.8) && (p < 0.95)) {
      width = map(p, 0.8, 0.95, -1.70, -1.55);
    }
    if((p >= 0.95) && (p <= 1)) {
      width = map(p, 0.95, 1, -1.55, -1.30);
    }
    if(p > 1) { // Possible output from bezier
      width = -1.30;
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
    width = calculateWidth(point.p);

    /////////////////////
    // LOOP
    /////////////////////

    var p_x = 0.0;
    var p_y = 0.0;
    var p_p = 0.0;
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
    var t = 0.0;
    var a = 0.0;
    var invA = 0.0;
    var idx_0 = 0;
    var idx_1 = 0;
    var idx_2 = 0;
    var idx_3 = 0;
    var idx_0_i = 0;
    var oldR = 0.0;
    var oldG = 0.0;
    var oldB = 0.0;
    var oldA = 0.0;
    var newR = 0.0;
    var newG = 0.0;
    var newB = 0.0;
    var newA = 0.0;

    p_x = point.x;
    p_y = point.y;
    p_p = point.p;
    centerX = Math.round(p_x);
    centerY = Math.round(p_y);
    left = centerX - 2;
    right = centerX + 3;
    top = centerY - 2;
    bottom = centerY + 3;

    // Step around inside the texture before the loop
    //textureSampleStep = (textureSampleStep === textureSampleLocations.length - 1) ? 0 : (textureSampleStep + 1);

    //////////////
    // Horizontal
    //////////////
    for(i = left; i < right; i++) {

      // Distance
      dx = p_x - i;

      // Byte-index
      idx_0_i = i * 4;

      ////////////
      // Vertical
      ////////////
      for(j = top; j < bottom; j++) {

        // Distance
        dy = p_y - j;
        dist = Math.sqrt(dx * dx + dy * dy);

        // Byte-index
        idx_0 = idx_0_i + j * w_4;

        // Antialiasing
        //a = 5 * ((0.3 / (dist - width)) - 0.085);
        a = (1.5 / (dist - width)) - 0.425;

        // Spike
        if(dist < width) {
          a = 1;
        }
        
        // Clamp alpha
        if (a < 0) a = 0;
        if (a >= 1) a = 1;

        // Get new texture sample offset at center
        var t = inkTextureSamples[textureSampleStep];
        textureSampleStep = (textureSampleStep === textureSampleLocations.length - 1) ? 0 : (textureSampleStep + 1);

        // Apply texture
        a *= t;

        // Grain
        var g = map(p_p, 0, 1, 0.8, 0.95);
        var prob = 1-(p_p*p_p*p_p*p_p*p_p); // 1 - x^4
        g = Math.floor(Math.random()*prob*2) === 1 ? 0 : g;
        a *= g;

        // Blending vars
        invA = 1 - a;
        idx_1 = idx_0 + 1;
        idx_2 = idx_0 + 2;
        idx_3 = idx_0 + 3;
        oldR = id[idx_0];
        oldG = id[idx_1];
        oldB = id[idx_2];
        oldA = id[idx_3] / 255;

        // Transparent vs. opaque background
        //if(oldA === 1) {
          newR = penR * a + oldR * invA;
          newG = penG * a + oldG * invA;
          newB = penB * a + oldB * invA;
        /*} else {
          newA = a + oldA * invA;
          newR = (penR * a + oldR * oldA * invA) / newA;
          newG = (penG * a + oldG * oldA * invA) / newA;
          newB = (penB * a + oldB * oldA * invA) / newA;
          newA = newA * 255;
          // Set new A
          id[idx_3] = newA;
        }*/

        // Set new RGB
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

  function inkTextureBase64() {
    // texturelight
    //return "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"; 
    // texturelight9
    return "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AAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAHjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADTwAAAAYAAAAAAAAAAAAAAIsAAAAsAAAADQB0AGUAeAB0AHUAcgBlAGwAaQBnAGgAdAA4AAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAsAAAAiwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAAbnVsbAAAAAIAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAAiwAAAABSZ2h0bG9uZwAAACwAAAAGc2xpY2VzVmxMcwAAAAFPYmpjAAAAAQAAAAAABXNsaWNlAAAAEgAAAAdzbGljZUlEbG9uZwAAAAAAAAAHZ3JvdXBJRGxvbmcAAAAAAAAABm9yaWdpbmVudW0AAAAMRVNsaWNlT3JpZ2luAAAADWF1dG9HZW5lcmF0ZWQAAAAAVHlwZWVudW0AAAAKRVNsaWNlVHlwZQAAAABJbWcgAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExlZnRsb25nAAAAAAAAAABCdG9tbG9uZwAA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b9J/28kpWGzIufdZWZrdtLd0bXmY9vqO3sexrf8Ai971pfZx6XpemPS/ej3x9D0v63+D3+p/NLJG33/zU7hP2zd6P0h/Y9T9zYtn37e/H8nw/wDbfd/r6aSn/9kAOEJJTQQhAAAAAABdAAAAAQEAAAAPAEEAZABvAGIAZQAgAFAAaABvAHQAbwBzAGgAbwBwAAAAFwBBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAgAEMAQwAgADIAMAAxADQAAAABADhCSU0EBgAAAAAABwAIAAAAAQEA/+EN2Gh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMwMTQgNzkuMTU2Nzk3LCAyMDE0LzA4LzIwLTA5OjUzOjAyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY1YWEwNTI0LTI0YTEtMTE3OC1iMGQ2LWExMWNmNjE1OTFkOCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowODYzZGVkYy05M2ZhLTRmNmMtYWVmMC0wMmI1MWZkZWNlYjYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iQ0U5N0M4QjFGQTkzQzYzQzcxRUNEN0VGODk1MjRBM0EiIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxNS0wMy0yNlQxNToyMzoyNy0wNDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2ZjA0N2M2Yi0yOWU0LTRjODUtOWQ3Yi00OTI3ZDJkNjczNDQiIHN0RXZ0OndoZW49IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowODYzZGVkYy05M2ZhLTRmNmMtYWVmMC0wMmI1MWZkZWNlYjYiIHN0RXZ0OndoZW49IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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";
  }

  function getImageFromBase64(base64, type) {
    var img = new Image();
    img.src = "data:image/" + type + ";base64, " + base64;

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

    inkTextureImageDataGrays = imageDataGrays;

    // Read samples from mirrored-and-tiled grays
    for (var i = 0; i < textureSamplesLength; i++) {
      // Get normalized pixel within texture
      var T_s = textureOffsetX / (img.width - 1);
      var T_t = textureOffsetY / (img.height - 1);
      var s = Math.abs(Math.abs(T_s - 1) % 2 - 1);
      var t = Math.abs(Math.abs(T_t - 1) % 2 - 1);
      var x = Math.floor(s * (img.width - 1));
      var y = Math.floor(t * (img.height - 1));
      textureSampleLocations.push({x: x, y: y});
      var d = imageDataGrays[x + y * img.width];
      samples[i] = d;
      //samples[i] = 100 + Math.random()*155;
      
      // Step texture offset randomly [-1, 1]
      textureOffsetX += (Math.random() * 2 | 0) === 1 ? -1 : 1;
      textureOffsetY += (Math.random() * 2 | 0) === 1 ? -1 : 1;
    }

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