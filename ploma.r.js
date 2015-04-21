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

  // TESTING
  this.setA_SHADE = function(n) {
    A_SHADE = n;
    this.rerender();
  }

  this.setSTEP_VALUE = function(n) {
    STEP_VALUE = n;
    stepInterval = n;
    this.rerender();
  }

  this.setSLOPE_VALUE = function(n) {
    SLOPE_VALUE = n;
    this.rerender();
  }

  this.setSHIFT_VALUE = function(n) {
    SHIFT_VALUE = n;
    this.rerender();
  }

  this.setWIDTH_TO_USE = function(n) {
    WIDTH_TO_USE = n;
    this.rerender();
  }

  this.rerender = function(){
    // Deep copy the raw strokes
    var originalStrokes = this.strokes();
    var capturedRawStrokes = [];
    for(var i = 0; i < originalStrokes.length; i++) {
      capturedRawStrokes.push(originalStrokes[i]);
    }

    // Clear and set rendering to false
    this.clear();
    //applyRendering = !applyRendering;

    // Redraw all the strokes
    for(var i = 0; i < capturedRawStrokes.length; i++) {
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
    }
  }
  // END TESTING

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
  //var paperColor = 'rgb(240, 238, 220)';
  var paperColor = 'rgb(255, 255, 246)';
  //var paperColor = 'rgb(250, 240, 230)';
  //var paperColor = 'rgb(245, 230, 218)';
  w = canvas.getAttribute('width');
  h = canvas.getAttribute('height');
  w_4 = w * 4;
  ctx.imageSmoothingEnabled = false;
  imageData = ctx.getImageData(0, 0, w, h);
  imageDataData = imageData.data;

  // TESTING
  var STEP_VALUE = 2;
  var SLOPE_VALUE = 0.56;
  var SHIFT_VALUE = 0.26;
  var A_SHADE = 0.85;
  var WIDTH_TO_USE = 0.57;
  // END TESTING

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
  var stepInterval = STEP_VALUE;
  var penR = 10;
  var penG = 10;
  var penB = 37;
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
    console.log(p);

    var f = WIDTH_TO_USE;

    if(p < 0) { // Possible output from bezier
      width = 0.2*f;
    }
    if(p < 0.2) {
      width = map(p, 0, 0.2, 0.2*f, 2.0*f);
    } 
    if((p >= 0.2) && (p < 0.45)) {
      width = map(p, 0.2, 0.45, 2.0*f, 3.90*f);
    }
    if((p >= 0.45) && (p < 0.8)) {
      width = map(p, 0.45, 0.8, 3.90*f, 4.90*f);
    }
    if((p >= 0.8) && (p < 0.97)) {
      width = map(p, 0.8, 0.95, 4.90*f, 5.05*f);
    }
    if((p >= 0.97) && (p < 1)) {
      width = map(p, 0.95, 1, 5.05*f, 5.05*f);
    }
    if(p >= 1) { // Possible output from bezier
      width = 5.45*f;
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

    //penB = (p_p < 0.55) ? map(p_p, 0, 0.55, 190, 47) : 47;

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
        a = SLOPE_VALUE * (dist - width) * (dist - width) - SHIFT_VALUE

        // Dip
        if(dist > width) {
          a = 0;
        }
        
        // Clamp alpha
        if (a < 0) a = 0;
        if (a >= 1) a = 1;

        // Clamp alpha by ink flow
        var flow = (p_p > 0.5) ? A_SHADE : A_SHADE * map(p_p, 0, 0.5, 0, 0.3);
        if(a > flow) {
          a = flow;
        }

        // Get texture sample
        var t = inkTextureSamples[textureSampleStep];
        textureSampleStep = (textureSampleStep === textureSampleLocations.length - 1) ? 0 : (textureSampleStep + 1);

        // Zero-out the texture for light touches
        if(p_p < 0.4) {
          t = 0.5;
        }

        // Apply texture
        //a *= applyRendering ? t : 1;
        a *= t;

        // Apply grain
        var g = 1;
        //var prob = 1 - p_p*p_p*p_p*p_p; // 1 - x^4
        //g = Math.floor(Math.random() * prob * 2) === 0 ? g : 1;
        if(p_p < 0.6) {
          if(Math.floor(Math.random() * map(p_p, 0, 0.6, 0, 2)) === 0) {
            //g = Math.random()*map(p_p, 0, 0.4, 0, 0);
            g = map(p_p, 0, 0.5, 0, 0.2);
          }
        }
        //a *= applyRendering ? g : 1;
        //a *= g;

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
    // texturelight9
    return "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AAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQQNAAAAAAAEAAAAHjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADTwAAAAYAAAAAAAAAAAAAAIsAAAAsAAAADQB0AGUAeAB0AHUAcgBlAGwAaQBnAGgAdAA4AAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAsAAAAiwAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAAbnVsbAAAAAIAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAAiwAAAABSZ2h0bG9uZwAAACwAAAAGc2xpY2VzVmxMcwAAAAFPYmpjAAAAAQAAAAAABXNsaWNlAAAAEgAAAAdzbGljZUlEbG9uZwAAAAAAAAAHZ3JvdXBJRGxvbmcAAAAAAAAABm9yaWdpbmVudW0AAAAMRVNsaWNlT3JpZ2luAAAADWF1dG9HZW5lcmF0ZWQAAAAAVHlwZWVudW0AAAAKRVNsaWNlVHlwZQAAAABJbWcgAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExlZnRsb25nAAAAAAAAAABCdG9tbG9uZwAA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b9J/28kpWGzIufdZWZrdtLd0bXmY9vqO3sexrf8Ai971pfZx6XpemPS/ej3x9D0v63+D3+p/NLJG33/zU7hP2zd6P0h/Y9T9zYtn37e/H8nw/wDbfd/r6aSn/9kAOEJJTQQhAAAAAABdAAAAAQEAAAAPAEEAZABvAGIAZQAgAFAAaABvAHQAbwBzAGgAbwBwAAAAFwBBAGQAbwBiAGUAIABQAGgAbwB0AG8AcwBoAG8AcAAgAEMAQwAgADIAMAAxADQAAAABADhCSU0EBgAAAAAABwAIAAAAAQEA/+EN2Gh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMwMTQgNzkuMTU2Nzk3LCAyMDE0LzA4LzIwLTA5OjUzOjAyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY1YWEwNTI0LTI0YTEtMTE3OC1iMGQ2LWExMWNmNjE1OTFkOCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowODYzZGVkYy05M2ZhLTRmNmMtYWVmMC0wMmI1MWZkZWNlYjYiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iQ0U5N0M4QjFGQTkzQzYzQzcxRUNEN0VGODk1MjRBM0EiIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxNS0wMy0yNlQxNToyMzoyNy0wNDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2ZjA0N2M2Yi0yOWU0LTRjODUtOWQ3Yi00OTI3ZDJkNjczNDQiIHN0RXZ0OndoZW49IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowODYzZGVkYy05M2ZhLTRmNmMtYWVmMC0wMmI1MWZkZWNlYjYiIHN0RXZ0OndoZW49IjIwMTUtMDQtMTZUMTU6MDI6MTUtMDQ6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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";
    // texturelight9-lights
    //return "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Y3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQPyAAAAAAAKAAD///////8AADhCSU0EDQAAAAAABAAAAB44QklNBBkAAAAAAAQAAAAeOEJJTQPzAAAAAAAJAAAAAAAAAAABADhCSU0nEAAAAAAACgABAAAAAAAAAAE4QklNA/UAAAAAAEgAL2ZmAAEAbGZmAAYAAAAAAAEAL2ZmAAEAoZmaAAYAAAAAAAEAMgAAAAEAWgAAAAYAAAAAAAEANQAAAAEALQAAAAYAAAAAAAE4QklNA/gAAAAAAHAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAOEJJTQQIAAAAAAAQAAAAAQAAAkAAAAJAAAAAADhCSU0EHgAAAAAABAAAAAA4QklNBBoAAAAAA08AAAAGAAAAAAAAAAAAAACLAAAALAAAAA0AdABlAHgAdAB1AHIAZQBsAGkAZwBoAHQAOQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAALAAAAIsAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAQAAAAAAAG51bGwAAAACAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExlZnRsb25nAAAAAAAAAABCdG9tbG9uZwAAAIsAAAAAUmdodGxvbmcAAAAsAAAABnNsaWNlc1ZsTHMAAAABT2JqYwAAAAEAAAAAAAVzbGljZQAAABIAAAAHc2xpY2VJRGxvbmcAAAAAAAAAB2dyb3VwSURsb25nAAAAAAAAAAZvcmlnaW5lbnVtAAAADEVTbGljZU9yaWdpbgAAAA1hdXRvR2VuZXJhdGVkAAAAAFR5cGVlbnVtAAAACkVTbGljZVR5cGUAAAAASW1nIAAAAAZib3VuZHNPYmpjAAAAAQAA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MTc4LTkxNWItYzFjYjBhMTAyZTFjIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjkxZGYzNGY4LWRjZjAtNGYxYi1iZGU4LWQyMmUzMDg1YzcxNCIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJDRTk3QzhCMUZBOTNDNjNDNzFFQ0Q3RUY4OTUyNEEzQSIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6TGVnYWN5SVBUQ0RpZ2VzdD0iQ0RDRkZBN0RBOEM3QkUwOTA1NzA3NkFFQUYwNUMzNEUiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDMtMjZUMTU6MjM6MjctMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE1LTA0LTIxVDE0OjQ5OjI0LTA0OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE1LTA0LTIxVDE0OjQ5OjI0LTA0OjAwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmYwNDdjNmItMjllNC00Yzg1LTlkN2ItNDkyN2QyZDY3MzQ0IiBzdEV2dDp3aGVuPSIyMDE1LTA0LTE2VDE1OjAyOjE1LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6OTFkZjM0ZjgtZGNmMC00ZjFiLWJkZTgtZDIyZTMwODVjNzE0IiBzdEV2dDp3aGVuPSIyMDE1LTA0LTIxVDE0OjQ5OjI0LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0idyI/Pv/iDFhJQ0NfUFJPRklMRQABAQAADEhMaW5vAhAAAG1udHJSR0IgWFlaIAfOAAIACQAGADEAAGFjc3BNU0ZUAAAAAElFQyBzUkdCAAAAAAAAAAAAAAAAAAD21gABAAAAANMtSFAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEWNwcnQAAAFQAAAAM2Rlc2MAAAGEAAAAbHd0cHQAAAHwAAAAFGJrcHQAAAIEAAAAFHJYWVoAAAIYAAAAFGdYWVoAAAIsAAAAFGJYWVoAAAJAAAAAFGRtbmQAAAJUAAAAcGRtZGQAAALEAAAAiHZ1ZWQAAANMAAAAhnZpZXcAAAPUAAAAJGx1bWkAAAP4AAAAFG1lYXMAAAQMAAAAJHRlY2gAAAQwAAAADHJUUkMAAAQ8AAAIDGdUUkMAAAQ8AAAIDGJUUkMAAAQ8AAAIDHRleHQAAAAAQ29weXJpZ2h0IChjKSAxOTk4IEhld2xldHQtUGFja2FyZCBDb21wYW55AABkZXNjAAAAAAAAABJzUkdCIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAEnNSR0IgSUVDNjE5NjYtMi4xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYWVogAAAAAAAA81EAAQAAAAEW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";
    // texturelight9-lights-contrast
    //return "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QFIAAAAAAAAAAAAKdmVjdG9yRGF0YWJvb2wBAAAAAFBnUHNlbnVtAAAAAFBnUHMAAAAAUGdQQwAAAABMZWZ0VW50RiNSbHQAAAAAAAAAAAAAAABUb3AgVW50RiNSbHQAAAAAAAAAAAAAAABTY2wgVW50RiNQcmNAWQAAAAAAAAAAABBjcm9wV2hlblByaW50aW5nYm9vbAAAAAAOY3JvcFJlY3RCb3R0b21sb25nAAAAAAAAAAxjcm9wUmVjdExlZnRsb25nAAAAAAAAAA1jcm9wUmVjdFJpZ2h0bG9uZwAAAAAAAAALY3JvcFJlY3RUb3Bsb25nAAAAAAA4QklNA+0AAAAAABAASAAAAAEAAQBIAAAAAQABOEJJTQQmAAAAAAAOAAAAAAAAAAAAAD+AAAA4QklNA/IAAAAAAAoAAP///////wAAOEJJTQQNAAAAAAAEAAAAHjhCSU0EGQAAAAAABAAAAB44QklNA/MAAAAAAAkAAAAAAAAAAAEAOEJJTScQAAAAAAAKAAEAAAAAAAAAAThCSU0D9QAAAAAASAAvZmYAAQBsZmYABgAAAAAAAQAvZmYAAQChmZoABgAAAAAAAQAyAAAAAQBaAAAABgAAAAAAAQA1AAAAAQAtAAAABgAAAAAAAThCSU0D+AAAAAAAcAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAA4QklNBAgAAAAAABAAAAABAAACQAAAAkAAAAAAOEJJTQQeAAAAAAAEAAAAADhCSU0EGgAAAAADbwAAAAYAAAAAAAAAAAAAAIsAAAAsAAAAHQB0AGUAeAB0AHUAcgBlAGwAaQBnAGgAdAA5AC0AbABpAGcAaAB0AHMALQBjAG8AbgB0AHIAYQBzAHQAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAACwAAACLAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxsAAAAAgAAAAZib3VuZHNPYmpjAAAAAQAAAAAAAFJjdDEAAAAEAAAAAFRvcCBsb25nAAAAAAAAAABMZWZ0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ICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NjVhYTA1MjQtMjRhMS0xMTc4LWIwZDYtYTExY2Y2MTU5MWQ4IiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmEwN2U2Nzk1LTE5NGEtNDYwYi04MzRhLWVhMDY0MjQ5ZGI4NiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJDRTk3QzhCMUZBOTNDNjNDNzFFQ0Q3RUY4OTUyNEEzQSIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6TGVnYWN5SVBUQ0RpZ2VzdD0iQ0RDRkZBN0RBOEM3QkUwOTA1NzA3NkFFQUYwNUMzNEUiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDMtMjZUMTU6MjM6MjctMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE1LTA0LTIxVDE1OjE2OjM5LTA0OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE1LTA0LTIxVDE1OjE2OjM5LTA0OjAwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmYwNDdjNmItMjllNC00Yzg1LTlkN2ItNDkyN2QyZDY3MzQ0IiBzdEV2dDp3aGVuPSIyMDE1LTA0LTE2VDE1OjAyOjE1LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTA3ZTY3OTUtMTk0YS00NjBiLTgzNGEtZWEwNjQyNDlkYjg2IiBzdEV2dDp3aGVuPSIyMDE1LTA0LTIxVDE1OjE2OjM5LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0idyI/Pv/iDFhJQ0NfUFJPRklMRQABAQAADEhMaW5vAhAAAG1udHJSR0IgWFlaIAfOAAIACQAGADEAAGFjc3BNU0ZUAAAAAElFQyBzUkdCAAAAAAAAAAAAAAAAAAD21gABAAAAANMtSFAgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
    // texturelight9-lights-contrast2
    //return "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ZFRVbnRGI1JsdAAAAAAAAAAAAAAAAEJsZCBVbnRGI1JsdAAAAAAAAAAAAAAAAFJzbHRVbnRGI1B4bEBSAAAAAAAAAAAACnZlY3RvckRhdGFib29sAQAAAABQZ1BzZW51bQAAAABQZ1BzAAAAAFBnUEMAAAAATGVmdFVudEYjUmx0AAAAAAAAAAAAAAAAVG9wIFVudEYjUmx0AAAAAAAAAAAAAAAAU2NsIFVudEYjUHJjQFkAAAAAAAAAAAAQY3JvcFdoZW5QcmludGluZ2Jvb2wAAAAADmNyb3BSZWN0Qm90dG9tbG9uZwAAAAAAAAAMY3JvcFJlY3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQPyAAAAAAAKAAD///////8AADhCSU0EDQAAAAAABAAAAB44QklNBBkAAAAAAAQAAAAeOEJJTQPzAAAAAAAJAAAAAAAAAAABADhCSU0nEAAAAAAACgABAAAAAAAAAAE4QklNA/UAAAAAAEgAL2ZmAAEAbGZmAAYAAAAAAAEAL2ZmAAEAoZmaAAYAAAAAAAEAMgAAAAEAWgAAAAYAAAAAAAEANQAAAAEALQAAAAYAAAAAAAE4QklNA/gAAAAAAHAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAOEJJTQQIAAAAAAAQAAAAAQAAAkAAAAJAAAAAADhCSU0EHgAAAAAABAAAAAA4QklNBBoAAAAAA3EAAAAGAAAAAAAAAAAAAACLAAAALAAAAB4AdABlAHgAdAB1AHIAZQBsAGkAZwBoAHQAOQAtAGwAaQBnAGgAdABzAC0AYwBvAG4AdAByAGEAcwB0ADIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAACwAAACLAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEAAAAAAABudWxs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SHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMwMTQgNzkuMTU2Nzk3LCAyMDE0LzA4LzIwLTA5OjUzOjAyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY1YWEwNTI0LTI0YTEtMTE3OC1iMGQ2LWExMWNmNjE1OTFkOCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1YTYzY2ZmMC1hMTE0LTQxMTYtYjhlYS01ZTk1ZWE0YjI3NzIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iQ0U5N0M4QjFGQTkzQzYzQzcxRUNEN0VGODk1MjRBM0EiIGRjOmZvcm1hdD0iaW1hZ2UvanBlZyIgcGhvdG9zaG9wOkxlZ2FjeUlQVENEaWdlc3Q9IkNEQ0ZGQTdEQThDN0JFMDkwNTcwNzZBRUFGMDVDMzRFIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcDpDcmVhdGVEYXRlPSIyMDE1LTAzLTI2VDE1OjIzOjI3LTA0OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxNS0wNC0yMVQxNToyMTo1OS0wNDowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxNS0wNC0yMVQxNToyMTo1OS0wNDowMCIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjZmMDQ3YzZiLTI5ZTQtNGM4NS05ZDdiLTQ5MjdkMmQ2NzM0NCIgc3RFdnQ6d2hlbj0iMjAxNS0wNC0xNlQxNTowMjoxNS0wNDowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjVhNjNjZmYwLWExMTQtNDExNi1iOGVhLTVlOTVlYTRiMjc3MiIgc3RFdnQ6d2hlbj0iMjAxNS0wNC0yMVQxNToyMTo1OS0wNDowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw/eHBhY2tldCBlbmQ9InciPz7/4gxYSUNDX1BST0ZJTEUAAQEAAAxITGlubwIQAABtbnRyUkdCIFhZWiAHzgACAAkABgAxAABhY3NwTVNGVAAAAABJRUMgc1JHQgAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLUhQICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFjcHJ0AAABUAAAADNkZXNjAAABhAAAAGx3dHB0AAAB8AAAABRia3B0AAACBAAAABRyWFlaAAACGAAAABRnWFlaAAACLAAAABRiWFlaAAACQAAAABRkbW5kAAACVAAAAHBkbWRkAAACxAAAAIh2dWVkAAADTAAAAIZ2aWV3AAAD1AAAACRsdW1pAAAD+AAAABRtZWFzAAAEDAAAACR0ZWNoAAAEMAAAAAxyVFJDAAAEPAAACAxnVFJDAAAEPAAACAxiVFJDAAAEPAAACAx0ZXh0AAAAAENvcHlyaWdodCAoYykgMTk5OCBIZXdsZXR0LVBhY2thcmQgQ29tcGFueQAAZGVzYwAAAAAAAAASc1JHQiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAABJzUkdCIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAPNRAAEAAAABFsxYWVogAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z2Rlc2MAAAAAAAAAFklFQyBodHRwOi8vd3d3LmllYy5jaAAAAAAAAAAAAAAAFklFQyBodHRwOi8vd3d3LmllYy5jaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkZXNjAAAAAAAAAC5JRUMgNjE5NjYtMi4xIERlZmF1bHQgUkdCIGNvbG91ciBzcGFjZSAtIHNSR0IAAAAAAAAAAAAAAC5JRUMgNjE5NjYtMi4xIERlZmF1bHQgUkdCIGNvbG91ciBzcGFjZSAtIHNSR0IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGVzYwAAAAAAAAAsUmVmZXJlbmNlIFZpZXdpbmcgQ29uZGl0aW9uIGluIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAALFJlZmVyZW5jZSBWaWV3aW5nIENvbmRpdGlvbiBpbiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHZpZXcAAAAAABOk/gAUXy4AEM8UAAPtzAAEEwsAA1yeAAAAAVhZWiAAAAAAAEwJVgBQAAAAVx/nbWVhcwAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAo8AAAACc2lnIAAAAABDUlQgY3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAoAC0AMgA3ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKQAqQCuALIAtwC8AMEAxgDLANAA1QDbAOAA5QDrAPAA9gD7AQEBBwENARMBGQEfASUBKwEyATgBPgFFAUwBUgFZAWABZwFuAXUBfAGDAYsBkgGaAaEBqQGxAbkBwQHJAdEB2QHhAekB8gH6AgMCDAIUAh0CJgIvAjgCQQJLAlQCXQJnAnECegKEAo4CmAKiAqwCtgLBAssC1QLgAusC9QMAAwsDFgMhAy0DOANDA08DWgNmA3IDfgOKA5YDogOuA7oDxwPTA+AD7AP5BAYEEwQgBC0EOwRIBFUEYwRxBH4EjASaBKgEtgTEBNME4QTwBP4FDQUcBSsFOgVJBVgFZwV3BYYFlgWmBbUFxQXVBeUF9gYGBhYGJwY3BkgGWQZqBnsGjAadBq8GwAbRBuMG9QcHBxkHKwc9B08HYQd0B4YHmQesB78H0gflB/gICwgfCDIIRghaCG4IggiWCKoIvgjSCOcI+wkQCSUJOglPCWQJeQmPCaQJugnPCeUJ+woRCicKPQpUCmoKgQqYCq4KxQrcCvMLCwsiCzkLUQtpC4ALmAuwC8gL4Qv5DBIMKgxDDFwMdQyODKcMwAzZDPMNDQ0mDUANWg10DY4NqQ3DDd4N+A4TDi4OSQ5kDn8Omw62DtIO7g8JDyUPQQ9eD3oPlg+zD88P7BAJECYQQxBhEH4QmxC5ENcQ9RETETERTxFtEYwRqhHJEegSBxImEkUSZBKEEqMSwxLjEwMTIxNDE2MTgxOkE8UT5RQGFCcUSRRqFIsUrRTOFPAVEhU0FVYVeBWbFb0V4BYDFiYWSRZsFo8WshbWFvoXHRdBF2UXiReuF9IX9xgbGEAYZRiKGK8Y1Rj6GSAZRRlrGZEZtxndGgQaKhpRGncanhrFGuwbFBs7G2MbihuyG9ocAhwqHFIcexyjHMwc9R0eHUcdcB2ZHcMd7B4WHkAeah6UHr4e6R8THz4faR+UH78f6iAVIEEgbCCYIMQg8CEcIUghdSGhIc4h+yInIlUigiKvIt0jCiM4I2YjlCPCI/AkHyRNJHwkqyTaJQklOCVoJZclxyX3JicmVyaHJrcm6CcYJ0kneierJ9woDSg/KHEooijUKQYpOClrKZ0p0CoCKjUqaCqbKs8rAis2K2krnSvRLAUsOSxuLKIs1y0MLUEtdi2rLeEuFi5MLoIuty7uLyQvWi+RL8cv/jA1MGwwpDDbMRIxSjGCMbox8jIqMmMymzLUMw0zRjN/M7gz8TQrNGU0njTYNRM1TTWHNcI1/TY3NnI2rjbpNyQ3YDecN9c4FDhQOIw4yDkFOUI5fzm8Ofk6Njp0OrI67zstO2s7qjvoPCc8ZTykPOM9Ij1hPaE94D4gPmA+oD7gPyE/YT+iP+JAI0BkQKZA50EpQWpBrEHuQjBCckK1QvdDOkN9Q8BEA0RHRIpEzkUSRVVFmkXeRiJGZ0arRvBHNUd7R8BIBUhLSJFI10kdSWNJqUnwSjdKfUrESwxLU0uaS+JMKkxyTLpNAk1KTZNN3E4lTm5Ot08AT0lPk0/dUCdQcVC7UQZRUFGbUeZSMVJ8UsdTE1NfU6pT9lRCVI9U21UoVXVVwlYPVlxWqVb3V0RXklfgWC9YfVjLWRpZaVm4WgdaVlqmWvVbRVuVW+VcNVyGXNZdJ114XcleGl5sXr1fD19hX7NgBWBXYKpg/GFPYaJh9WJJYpxi8GNDY5dj62RAZJRk6WU9ZZJl52Y9ZpJm6Gc9Z5Nn6Wg/aJZo7GlDaZpp8WpIap9q92tPa6dr/2xXbK9tCG1gbbluEm5rbsRvHm94b9FwK3CGcOBxOnGVcfByS3KmcwFzXXO4dBR0cHTMdSh1hXXhdj52m3b4d1Z3s3gReG54zHkqeYl553pGeqV7BHtje8J8IXyBfOF9QX2hfgF+Yn7CfyN/hH/lgEeAqIEKgWuBzYIwgpKC9INXg7qEHYSAhOOFR4Wrhg6GcobXhzuHn4gEiGmIzokziZmJ/opkisqLMIuWi/yMY4zKjTGNmI3/jmaOzo82j56QBpBukNaRP5GokhGSepLjk02TtpQglIqU9JVflcmWNJaflwqXdZfgmEyYuJkkmZCZ/JpomtWbQpuvnByciZz3nWSd0p5Anq6fHZ+Ln/qgaaDYoUehtqImopajBqN2o+akVqTHpTilqaYapoum/adup+CoUqjEqTepqaocqo+rAqt1q+msXKzQrUStuK4trqGvFq+LsACwdbDqsWCx1rJLssKzOLOutCW0nLUTtYq2AbZ5tvC3aLfguFm40blKucK6O7q1uy67p7whvJu9Fb2Pvgq+hL7/v3q/9cBwwOzBZ8Hjwl/C28NYw9TEUcTOxUvFyMZGxsPHQce/yD3IvMk6ybnKOMq3yzbLtsw1zLXNNc21zjbOts83z7jQOdC60TzRvtI/0sHTRNPG1EnUy9VO1dHWVdbY11zX4Nhk2OjZbNnx2nba+9uA3AXcit0Q3ZbeHN6i3ynfr+A24L3hROHM4lPi2+Nj4+vkc+T85YTmDeaW5x/nqegy6LzpRunQ6lvq5etw6/vshu0R7ZzuKO6070DvzPBY8OXxcvH/8ozzGfOn9DT0wvVQ9d72bfb794r4Gfio+Tj5x/pX+uf7d/wH/Jj9Kf26/kv+3P9t////7gAOQWRvYmUAZEAAAAAB/9sAhAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAgICAgICAgICAgIDAwMDAwMDAwMDAQEBAQEBAQEBAQECAgECAgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwP/wAARCACLACwDAREAAhEBAxEB/90ABAAG/8QBogAAAAYCAwEAAAAAAAAAAAAABwgGBQQJAwoCAQALAQAABgMBAQEAAAAAAAAAAAAGBQQDBwIIAQkACgsQAAIBAwQBAwMCAwMDAgYJdQECAwQRBRIGIQcTIgAIMRRBMiMVCVFCFmEkMxdScYEYYpElQ6Gx8CY0cgoZwdE1J+FTNoLxkqJEVHNFRjdHYyhVVlcassLS4vJkg3SThGWjs8PT4yk4ZvN1Kjk6SElKWFlaZ2hpanZ3eHl6hYaHiImKlJWWl5iZmqSlpqeoqaq0tba3uLm6xMXGx8jJytTV1tfY2drk5ebn6Onq9PX29/j5+hEAAgEDAgQEAwUEBAQGBgVtAQIDEQQhEgUxBgAiE0FRBzJhFHEIQoEjkRVSoWIWMwmxJMHRQ3LwF+GCNCWSUxhjRPGisiY1GVQ2RWQnCnODk0Z0wtLi8lVldVY3hIWjs8PT4/MpGpSktMTU5PSVpbXF1eX1KEdXZjh2hpamtsbW5vZnd4eXp7fH1+f3SFhoeIiYqLjI2Oj4OUlZaXmJmam5ydnp+So6SlpqeoqaqrrK2ur6/9oADAMBAAIRAxEAPwBU/Inbmxdv9pzdVbe6e3l3lHW5+lyme3vgmyHatRlzS4anpOtuvMPk5aSiz+yMJja5hVZOhppqfHZMVdMiP/D5ZFf3XumDCdD4baGN3f2x03mujuxsfldmJHuLrj5RYndVD2hQR1dDmMtnd6bV2hWZaSOnq8jkGjOLgx9E0TxxsaSeCIAt7r3Sd3dR9c7a2Zkq/b/dVXs7Cx1lT9z0uNuZHqbetFP4qel31l8WlFV5jMHrjK5mCZMTI21arMGVZaeQUSeRvfuvdNe1Or8tlMz1VTdK7X3pvDfe7tiO2d2RWjsrrzZUG7MdkZYF27Wbt3OMvQVCUe15FqaWppZ8VW04aSpX7UtFB7917odqbJb22lU7d+RVV8etrdFZTY+78jSb1l2lU9kdlbpqsrljolmpY81Q/Z9YYTIVOEmolGKyFTT1Uk1XJVkySS05917o63+ze72/0Df6Tv8AZPMx/oSv/wAzE/0j9f8A8R+0v93/AH8/u1/AP4f/AHP+w/3F+HzfxD+K/wC4z7T7P/L/AH7r3X//0DbfMP5gdyYHrrtDFde7A27WY/FVPXFJuntPam34G2vsal3PhXhxq4sbhq9t70rewZMxSwmeKGjy0WApqQ08jtVXWP3XuqNMpX7x3LupdxdsbkrsznO0svX1+z9yU21sfvTcvYmaWagw1FTxV8FRtjeWKoMhPUUkMCPUYwRNPBJ9qUuW917oy/TUm/Omq/bG39/bT6m6Dp+wchVVdT8iO4dp0O690V20MJueOnSfa2y9zZPPUOz6jbO6YaWMVWPpMhGXSOqq4mhgklb3XulPuzsfvLNzJU4PdvcPYvWeF3vT47LYHcHYmb3R152z/d7Ozy5fs6HfWyaPH1GzsXkTDUK2B2xU0VNgsdRhYAIRUM/uvdG76x3D2du6Om2V0tkO7Yt70tZuigpeu98wba2h1BhsCs+Qz2R2hjO9t94HP9wLhoclU05x9f8AZVlbLDUv4fEfKkHuvdWBf7Lj27/sv3+i7wbD1/3x/vn/AHG/03ds+D+/f94P72/3N/0xav77/wB3v4z/AJRb7L7+3p8vi9Pv3Xuv/9E7fZe+/mZ3tj909U4zpPBdO4rdWcqclu3cdXWbhzO4N00mDqaaiocv15NuPGT7XzWO3BkPs5kwsLu9Okc1JUSUv3aVTe690Q2i+PnyMOX3bt+o7moerKfN5HKUO1JIrZSg7LwfWmOx1DL2Zht/09dXbc26sFPPMKynfO0s1bVwTJABLTlW917py3h8L+7t77RocbtbtXqTvvDdMHa9J/d3Jbjmyw2XW0uJq9008uJzmO2rtvac206/C7iqTLh8lknR8pMKWOvmnEfg917oDIqfe2PzlJXfFDN1kGD3RLncnWjB9f7npdVVU0f3lBV0mKxO1dyTptKOOetp6EZgTUwjxrGOaM6CnuvdDv1fJ153Ptzshvk13tkezcd0pk5azrHuWpzKYjc+xM00ZybR7axp3bgAu9jualpXocVVCvCwR009O9PGlWvv3Xurnv8ATx8cP9la/wBMf+zM70/0Y/bfwr+/H98av+/33l/7t/3e/hn2v3n96/4x+/f7XzeT9/zfYer37r3X/9KzntHr7fu89pVWyO4flN3F1VgqLbsmdpa2t2tsPJZ+rpMLS165LMtuDD7K29VZCOkqKxPsoYY2y8kIR6mJa+OlqYPde6p1z9J05Sdgr1ptv5QYTvYYFsJSbMx+I6z3BtTAbUxMckseBwfXWTxWRl2Vn8nUT5OkyM2Ex2AqKfO5lUpCzSrLUR+691zp+3vkBtqt3r1jh/j7sTedXhd7JunsPaWN6w7R6RoKaLDZSkxWxt1V+2cdu2SivmNyUf8AG2qFxxq6eoVIaxqpCkh917rlmtrdmb37DmosTtTsDG99Z3K43sbevV3X/Y2+tp7q3V1Plcc8DQ4yXaOYmkwu0amsrFqVmoq9KuUieppqKGJpIz7r3VtSdB9MdwUVPuXvrpPcMW9qyk2jjq3dOLr6Hd+86aOLM1r7fxr5DP7H2lvXBS0GXopIanEZPGJlWnyb0aCqpL6/de6Eb/ZZelf7pf6Q/vesf7xfxD7n/SH9tuv+K/wj+9vi/gH95/4xp/vF9r/kn8O+w+78X+4b/gF+57917r//07B/lB3B1PvXcu19h5du1+ue8cJuLBRYjsDqXG1XZOK2bgmwuTpML2FuLI0inaFLtzb24dx1FRVY+F0y2mlEtLIpMEnv3XuiNdZUmyfjt2fPRbK7v23VL3VkJpdl9w5DZ/X26tuUdJnMlkJ9073qd1S0u1tv49aqjpZoq7HwUmOjVsl9kslNL5JT7r3QfYX5Rbwy/ZPWm29xb82H1Tv+ujyOGn7wzG0Mj1/1Tmc3QvFBt3F5GPYNZmF7O2jlIZWx71ecqIaeFpRLLZY4Ub3Xuh3G0fnB89t6ZbEb3yydIQ7Po6+vxVRsLZj4jbG9duYymo6XbtXgt/ZHM4XdW7KHcefonFDVJVY2KGCo8kkXjl8dP7r3Qwj4w/6QNk0uxe5u14ui+0Nsbbx9BT4mi3rX53em9aKiyLNtbuHKbMpsrt99m53EUuJipqivo3yFZUUdM33lSamngqR7r3SJ/wBln6v/ANIv+yWf6c/kP/o0/vd/fnw/3i3p/df+E/6L/wDSB/eb+9Wv/RL/AHXv/l32X2H3P8Z/yvXo/d9+691//9Syap258ne2KDCYPbvafWG+qOXA1kUNGmObpjdGxcDWqKTL4HG5zZ9TmarP5fcWHpWiWqpqbCRlU8sZoPHIkvuvdNe+anK7Iosr1NszbOwNv7irNu1GWym8lbrncsOQXZ+P3JWjZVTBNgKzCxZzMZ/DGNqFKGSqo9EtTVZBJJqWaP3Xui27gpOrv5ke++vU3Jt6q2vVdYUe8dq47cvXO8sBmNjdq7pwkNDurdf+jHFfb0sM266GVaqtp8dnaKjjytO8dQjV2LWYze6900ZL4p7e6v3puza1ft75Wd37Ngw43H1pX4zstdq7UTcdLj6unymEq6/Y0lFLX7wwlLSU0Ue33hnoJIUnkkCIiRn3Xuhj6o251vRbrwW5N8022cruza2UqRvbtrL1zZPcvRlTRGmxmNftzuHfC4ahzu38pkM3R4+mwlJUyJlaTwkweJKmog917ozn+inqP+N/6OP9OG8v9Ev94v8ASx/cf+8uC/0U/wAH+4/iX8P/AL1fxf7j/RB/eD/If4Xrt5f8lvo/e9+691//1XHs/uDeHZPZc3b+xYdx/G5I8NTYTDz7U2/2NQZeKi3uVyW896bopd04ygxO7sftaq/iGNpp8GIqKcwTPHUxEx01R7r3XeEznSe1MHtSkw/yV7l76qsTHj9u9t4LqXc8mzqLd+WyBpf4tv7btZnc8u6OquuTkszQ0mTzUtYJjkKarhqKloXmd/de6Eio6s+LO2c1uLdOP2N3L8acxu3L7Qw9Vt+Pb28s50/seRK6Cljpz231tUZvrWqhzVRQUGVyNRQZWprZ6GrWgjV6aol9+690NXaPSMPRWKw+c+W3dFV2n17nd1UtBsGbrHd1f1NuzZ+Qr5kxNHiqDE4ykbHVWx6GnmStr8hQ1+NrqOoaJWgqooY3j917qV171Xu/sisxnanTvy+w+R6d2xm6iHbPVuUq8PvCI1lNU/fyV/dvY2cqcrVVe+sm2Oywp9xvRnLR0U1HFT1oFW8qe690ez+43TX8F+28W0r2/vl/oa/vftn+7P8Aez7H+Bf3c/vr9n9p/APtP8k+w0/Y/d+r9fv3Xuv/1jM9w/Kv5i7X29huwcvB090bsDIYXcuN25jcjRv2rnN3be2/SVGUpYt1VtFV4uk66yW3aLxx51KWN6SSrMcsTTxPGknuvdEKrvk/Tdmvgt5dzdO1GPqqLcOyaPZOE2LszdfWuzP77bjqMVT1uf3ru3EJkKzPwLtunin/AIJQ0E9HmIIZKeSCc6W9+690czKfEzGUEIxOzvkJuTq3f+X2duPdUPVlPuukozHT1Ynbde89y4XsPdG8Md1HsrHSzQ4WDGQJhqvysEp66GRHRPde6CvD/CfdvZ2yY91bDwXzK2RvfI7ofKLlNxZ2szODwGawUH29Tjd4YTsvfsXYePqsWyplIa2nx+UqKuaSOKlqQdUI917oK+/fh7u34oZ3eO9dmdgDe2MoMjsrLblpKvAxHG12HraqgrIt47nwG0SmKpdubW3SaiZpvsZKLHwRySzzxmM6/de6uj/0pfJX+Mf3D09A/wARt/e/yf6Pd9f6BP8ARx/oy/iGn/Sp5Ps/4b/fD/KvL9r975P2vD9n/lHv3Xuv/9cYe0usIsKlB3R8he+OqcZ17/eXLbhx/Tu28hnWTaFbkKH+DbGo8hubP1LVuOp3GGzNHHjaqijkxlfOscdc4jkZ/de6D/YnZXa2+MdvLqKp2h1ZmVptz0EGU2Z2emJ2buKXrvJbbbEYfcGLljzdJtbH1tHDNVy49NdPi6+dEDVSw6oo/de6fE6+pOp90R1XW+/n662Z2VnKGLIUuyNr0vffa2x977d25QbErsV2p3C2WqUni3BlMfDLDR4uSowNFVnXOJaKOnv7r3Q37d7I3Z3i/Z1N0tm+5d5dL0lHszbmf3fsLs7GZzvLe3bGPx9McpvjKbuy+4Eg6u682bUxUMOvE4fM0eWx0NfLS0T+aFj7r3Si6f8AjL171RmoNybS7mrouydu7iwJwe7u/Np5reeXg2flNvyHdeyc9ufr/dFDsPI7F3xtqGSoxVJU6fPHBFWwqR4KiT3XurB/492z/df/AEj/AN6Oh/7nf38/h/i/vvvT/Rd/o+/h38A/jv8AG/4L5f7x/wCkX/IPsdH93f4d/lOvy+r37r3X/9AyHYuB21Vbz3jX4fatDtLtXfezcjuvrjIbyot11EXcW39t7Rqd/wC8ezOrMphqXf3W9TvrDK0SyDJY+HJ18ePq/wCH06R1lNXH3Xui00Xy4q+29wU8O4c/1jUbHzNHtTaK7zTrJuw8nT4Wg3Zt+hXY29dnbSoaFMNlOwdsxQUWGqMtk4aLH5OOOtZZqfx0Y917pQ7nrOpO2uwd0dX7X+G2+/kXNBKdx717CrOv927a34duUL4Kg3ZnsHFuHIYbbOGyk1XTJj6UR1E080DO9DDPCgUe690LmysZ8iIMftHc3X3XOz9p4jNy0uY666Kl693Bs3a2C2kUyiVH+mbt/JbwrK/dvVqBKSeny9FiMNkIq14afJxTUtVK1N7r3SixGK+LNTvbbvxv+QdZ1t0PmqjHY/cW0cF0Bv8A7G6Xy2Kzks0mK3Ltnc2DpdyUuK62pshLiqeLFbfJq9WNSavirOQU917o7/8Ao47K/wBC3+jD+9OZ/wBEH93f7gf3809feb+5P2/90/L/AHR8P93P7uf3O9N/4P8Af/ff5R9vb9737r3X/9FOZ/vr4kU+48rVSbb3XBuHG/3k3DTbD3fn8lsXDbU3bitqPgv4Ns1KOuvsHcGENPK2DoqJaeaWRIaeQzBiYvde6Jpkt6Y+v3VupOu8XnsNT9ibimz+0d5VlTuTHUee2ljMjDksg1Bhcxk3lSvOXpEkSsrTLV0/gCx+AzTxv7r3RwOpf5iPem6Yt2L2FisJuLDzbWyMMm6YN8HFbz27tyqpIsfUx0WR33nKzG7s2bLuKSKpkoKtauuM08yU0whNo/de6EPK/JtO1No9abwqvk3vfp3cOzcVvtdkybKhgwPX8ec2HQRTod04+aAVm39p72URY3wZytqKarlljemippZoGj917pYbd+XXYXZlTvfK9VfFbC7n3yds7LzeI3fvTcNdFj9kY1cLDgd0DPZDdlNkd27mEuTp6R8WC01DRaR5KmNnZZvde6XH+zCV/wDdr/SD/sw2F/02/bf38/uL/cvZH3H9+v4b/dT/AEZf3H+3+7/hX8b/ANzn3f8AFftfL/lH8U/h/wDk3v3Xuv/SLfV/G3v2bdGV2BQfHXaHSddvqprt14Cff8k+8d05cbRzlKs2D2zuXN5GppGzNRuqvakpMVNTR5PJpGYf3UEhqPde6Red+Pm3t1ZpKGfu7o/bL0KUlLubK7D2lv3N7BxWdnFfm5sb2DlvDHjafec9DC09Vj/HQJjRpo44XaAg+690Hi7b7Cq9hywx7g6o7c6y21kqjI1dPTVW2cbXbQqC9UgyNHUbwXbOaxf8ZSOb+HJRyTNklikeBJI1cn3XuuA2x1r/AHmpcLSdQdnbbpt14uhpo8LTdp4/dldUZqokoKWWs2D9jR46s3Vi8kY3ZYMrUyU/gqPIuoQRK/uvdHh+LmwK7bfaUWfOJ3p1dXNjMzjOutwmPbJgnnr6Kkqa3bG7+qxXQVWRy24tv4ysnr8HPh3pJKcNOkkLrDVn3Xuh2/0e93f6H/4h/cPG+X/TN/H/APSN/EOuv4P/AKOP72/wP+J/3f1/3w/0Qf3/APV/A9fn/g3r8nm/yb37r3X/011v/flF3jvM4vaHxL3ju7eGz+xMzU5Olz3aPacO8ds4WmfNZGLcNBgNrQVs1ZujBbn8tDU1S1MFZJQw66IyeqpPuvdAxVLkt47x2fRdT9IdcVTUXWtX/efbnem567M9Z0c6UlbFT0W8Ou8hisDVYobYyNbPDhMhUGnp1qKyYBYlYFvde6AfHjsrr3OZ2lrcz0Z1Tl4cXJi1wXSmJ693jvrcL5Wu27t87Uo8PP8A3kqKvAVGRkgzMgpV/iT1TLLSMEj8cXuvdKzYPafQmB3ZmvjpvbZvYHxr2pvrP7Kp90723TuLGV3Y/UW58LTYen3Imb/jWKokxG0ZJIqmpppa0VxgyVTT18cNN4pEb3XujS434p/JDDds4XtPYm5+xO8sZkdiU1Jl9/x9lYvI9h5jrpo5s5uPCbvm3DSUG7dkHd+z8lJT4mnp56aryOTDulRShkqI/de6OZ/dHor+7f8Aef8A0G9H/wB/v7r/AMP++/0gVf8AEf78/wAL/gf8a/i/8S/upfw/5Zf7i32f+UfeauPfuvdf/9QQvlH3b3ju/dNJherO/wDPUuMwM1FtLc24dhdbbc6lyXdWflyX95Nzbw2jvFK3L4DG5PALko8FTYLMZLG5CHJUdTNVaab7uRvde6QG4PkdunsvsrFvBtTf22KXYLz4XeeGbD7KZt2UmDraCp3FtTde5aGqbB4XM5aemiNDuGDcGaTGzRK01K9FI8Pv3Xui8dY1/TR3duXA5jceM693Puvs7JZfblFt/rvD9mZZ8Fk58lnMdtWmyefl2Xs6jzx3i1FprcrGdvSxxGto2hZVjT3Xuhc3ptbM9r5LbmI+TmK7EyW7M5FkcFsHOZTEbJzXcW5I63MUOJ2/ld/4vac23tu4Ciq6mKLH02XgranFQ+Dyyh3rYJPfuvdDh1Z018h+sersHWS96Z/pPL4zeU+2p+tT2rg6uv7RotsZaurKrYdVBRVOTyOOzNLtbCS4iOOhgojS0Uf8RWSWn1Ffde6Nr/ssnxq/2SzR/ov7d/hP99v78/6Mv9OEv8T/AL6/xT7f+Hf6Tfu/4B/C/sP8kvq1/wDKFo+7/b9+691//9Vy3V2H1hvjcm28d8fMtQ7ZpMlBsrZQ2T3Bv3srp/a24KJs1QZKn2j/AHNy+0N2YbFbI3PLWV9E2Rr6mqWsyVVVeNrQoo917oII9l1GJrzTfIbquCu6MyWB3PXYeHYe3949r5WqSHH5aTHybLzezTiZNldUYfc+DInhWhSeHDUix07w49kCe690HFF2NicVgsR1vieqdgdbSNhVyUXY+Bjpe197deZjA+A5fc+b2pV4yvxNdT1wp6LHU09VWePHRVMj1RZ2iaP3Xuhr+NVblt4b1x1Rle1Nu9GbuyW2avF7l3JuGLE7tp83Xblmy+B2XiaSgrqnBbf2fi9y5+nkxu6cFTVFMoyQxlVPIlRI7y+690I3xqj2TDu+txHYeW6h331d2ZENt712t21s2q2/2vuBcrQ5ikx0zUtHhMzWb62ptCv2lSTZqTH5N6CoqXWaCpWK0S+691Zj/suW7v4T/dj+J7Z/0W/7LT/eD+NaNj/Z/wB+P7//AN6f7m/wH/jxP9CX8E9Xm+1/iX2nP8U+6/yj37r3X//WGHvDprq3cPZe8Idm7l3Ft7svAR5Kj3y+K34m4tv0e99gU8m+sduCu2V28KSTdGwMLm55q3J0WLoarIRS1EcsfnAkY+690U+nwvxNrtu7ifeHYPenXmU3WcdlMD2XtPceewewu2a3d2WeryWXwXWf2y7Hqc3LiqmqoKSlkkqaSeeF1SEo0VMvuvdHBqz8kuuarMUdJ1xhe/tmNKudh3LtijosZvvdnXGSwcldQ183S22sZjtpUKz4GZpKtY8lj6CqKIscSVZeb37r3Sj2P2X1hmdyZqDcPS/aORx/b+3IsD2PtvN0eGq+p8fntxQYenzWF2/g9/db0+BxXX9bV4dJqgyWqpKjTWqk8KvOPde6UPa+5cC1ftrc+J7D6Z25v/K4P/Rpjdsb42fvvJbE3NPh6jF7f64jEn29BSbhr6yuqIKHH46mrqCiramplqUpzN5F9+690I/+ykVf+hT+GfxnN/wT/Rt9r/cP+9uwv9A399/4Z4v4/wDxv+NeD+538J/yH+7ujxav9yWv7z9737r3X//XMZ8rUycGA3jtbu2bZu7d2ZzcO4t+9N5XcHXubqcp1bk8jenyWDz1Hnq7I7kzlPg8Q2Oqos3RYzL1e3sfVxmoWTDr46f3XukPsj5S9p95ZTZu1eu/jJhcRnI8RNg987qj6vxNdJR5WlpYKOLd20MG2b2hjo8nNDiatZ59vRGtxcUSgwSyS0ccHuvdF92FtnfOL7Ex+V2x2Bvel7i2pnc5if8AQ9tLd2ATdmV3ZRZHP1+1sntqi7OztftPEVGXxtVXTVO145Yq4QF4VinlpRBN7r3RnMX233Ru3azyU+SzvS27vi/ic3jt+SVWdly3b25ZcacdU5Xb+Ewldju3sXu7PDGxVbUmOrMLj/4jWSRGOeKGUqvuvdCX8Ytq9n7/AM32N2Xi87T1mx90f3TyWEoNzyYxsL2jlaTPzYlo8ed/7mqN07U3dtenxVG9KKaKLFSZXLyzl0qJZo/fuvdWd/6PKT+7P90/7oUH9zvHo/jf8OrP9IX8C/493+4F/tft/wCOX/3DfxT+Lfb/AMB9Wrx/v+/de6//0DG72/uz/Hfk/wDcf7Lhr/v5vz+O/wClL/S7/D/uf7l5vyf6N/4Z+x/EPufH/eX+7f8Akv8AE/4n4/2PN7917pV9rf3Y/wBAWxPvP7ufwX+8m2dX+jT/AEvfx/8AjH+jofZav4D/AMZA/hltPk0f7gv4ff7rnye/de6I52h/FP7y4/yf38/hH2FF/er+6v8Ac/737m2X/i39yftP9/z9x/B/H9x/cz/JfL5P4b/uT8/v3Xuj/dJ6/wCA7f8A4F/o6/hmqH+7/wB/4P8ATl4/76bm+3/0j/6R/wDf22/5Uv7z/u+T7/z/AJ9+690BuG/hX8X3/o/0AfxH++0v8S/2dX++X+y6eL+/mF/h/wDCPN/v1f74feeb+D/wn97z+X73/JvtffuvdXV/7l/4B/ykeT+73/Zj/afb/wB2/wDzl/0F/wAW/wCqn7r/AKtvv3Xuv//Z";
    // texturelight9-lights-contrast3
    //return "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AAAAAAAAAEJyZFRVbnRGI1JsdAAAAAAAAAAAAAAAAEJsZCBVbnRGI1JsdAAAAAAAAAAAAAAAAFJzbHRVbnRGI1B4bEBSAAAAAAAAAAAACnZlY3RvckRhdGFib29sAQAAAABQZ1BzZW51bQAAAABQZ1BzAAAAAFBnUEMAAAAATGVmdFVudEYjUmx0AAAAAAAAAAAAAAAAVG9wIFVudEYjUmx0AAAAAAAAAAAAAAAAU2NsIFVudEYjUHJjQFkAAAAAAAAAAAAQY3JvcFdoZW5QcmludGluZ2Jvb2wAAAAADmNyb3BSZWN0Qm90dG9tbG9uZwAAAAAAAAAMY3JvcFJlY3RMZWZ0bG9uZwAAAAAAAAANY3JvcFJlY3RSaWdodGxvbmcAAAAAAAAAC2Nyb3BSZWN0VG9wbG9uZwAAAAAAOEJJTQPtAAAAAAAQAEgAAAABAAEASAAAAAEAAThCSU0EJgAAAAAADgAAAAAAAAAAAAA/gAAAOEJJTQPyAAAAAAAKAAD///////8AADhCSU0EDQAAAAAABAAAAB44QklNBBkAAAAAAAQAAAAeOEJJTQPzAAAAAAAJAAAAAAAAAAABADhCSU0nEAAAAAAACgABAAAAAAAAAAE4QklNA/UAAAAAAEgAL2ZmAAEAbGZmAAYAAAAAAAEAL2ZmAAEAoZmaAAYAAAAAAAEAMgAAAAEAWgAAAAYAAAAAAAEANQAAAAEALQAAAAYAAAAAAAE4QklNA/gAAAAAAHAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAOEJJTQQIAAAAAAAQAAAAAQAAAkAAAAJAAAAAADhCSU0EHgAAAAAABAAAAAA4QklNBBoAAAAAA3EAAAAGAAAAAAAAAAAAAACLAAAALAAAAB4AdABlAHgAdAB1AHIAZQBsAGkAZwBoAHQAOQAtAGwAaQBnAGgAdABzAC0AYwBvAG4AdAByAGEAcwB0ADIAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAACwAAACLAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAEA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vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzAxNCA3OS4xNTY3OTcsIDIwMTQvMDgvMjAtMDk6NTM6MDIgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6NmE1YTc2YjctMjhlZS0xMTc4LTkxNWItYzFjYjBhMTAyZTFjIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjk0ODk5MDdmLWRhNWQtNDc1MS05ZWNjLTU5NDQxYmEwMTMyYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJDRTk3QzhCMUZBOTNDNjNDNzFFQ0Q3RUY4OTUyNEEzQSIgZGM6Zm9ybWF0PSJpbWFnZS9qcGVnIiBwaG90b3Nob3A6TGVnYWN5SVBUQ0RpZ2VzdD0iQ0RDRkZBN0RBOEM3QkUwOTA1NzA3NkFFQUYwNUMzNEUiIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wOkNyZWF0ZURhdGU9IjIwMTUtMDMtMjZUMTU6MjM6MjctMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE1LTA0LTIxVDE1OjUyOjU3LTA0OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE1LTA0LTIxVDE1OjUyOjU3LTA0OjAwIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE0IChNYWNpbnRvc2gpIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6NmYwNDdjNmItMjllNC00Yzg1LTlkN2ItNDkyN2QyZDY3MzQ0IiBzdEV2dDp3aGVuPSIyMDE1LTA0LTE2VDE1OjAyOjE1LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6OTQ4OTkwN2YtZGE1ZC00NzUxLTllY2MtNTk0NDFiYTAxMzJjIiBzdEV2dDp3aGVuPSIyMDE1LTA0LTIxVDE1OjUyOjU3LTA0OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0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";
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