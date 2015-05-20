/*
Scamper - Even points along a cubic Bezier curve

Dan Amelang
Evelyn Eastmond
Viewpoints Research Institute

(c) 2014-2015

TODO: License
*/

"use strict"; // for strict mode

// ------------------------------------------
// Scamper
//
// Constructor for Scamper instances.
//
var Scamper = function(opts) {

  //////////////////////////////////////////////
  // PUBLIC
  //////////////////////////////////////////////

  // ------------------------------------------
  // newStroke
  //
  // Start a new stroke and reset curve and
  // step calculation variables.
  //
  this.newStroke = function() {
    curRawStroke = [];
    curRawSampledStroke = [];
    curFilteredStroke = [];

    stepOffset = 0.0;
    lastControlPoint = null;
  }

  // ------------------------------------------
  // addPoint
  //
  // Add a point to the current stroke and
  // create a Bezier if enough filtered points
  // exist.
  //
  this.addPoint = function(x, y, p) {
    pointCounter++;

    var point = new Point(x,y,p);

    //
    // Raw
    //
    /*if(curRawStroke.last().equals(point)) {
      return; // ignore dupes TODO: ??
    }*/
    curRawStroke.push(point);

    //
    // Sampled and filtered
    //
    if (pointCounter % sample === 0) {

      // Push sampled point
      /*if(curRawSampledStroke.last().equals(point)) {
        return; // ignore dupes TODO: ??
      }*/
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

      // TODO:
      // - Handle single point and double point strokes
      // 3 points needed for a look-ahead bezier
      var len = curFilteredStroke.length;
      if(len >= 3) {
        createBezier(
          curFilteredStroke[len - 3],
          curFilteredStroke[len - 2],
          curFilteredStroke[len - 1]
        );
      }

    }

  }

  // ------------------------------------------
  // setPointHandler
  //
  // Sets function to handle points as they
  // are created.
  //
  this.setPointHandler = function(fn) {
    handlePointFunction = fn;
  }

  //////////////////////////////////////////////
  // PRIVATE
  //////////////////////////////////////////////

  // Args
  if(!opts) {
    opts = {
      step: 5,
      sample: 1
    };
  }

  // State
  var curRawStroke = [];
  var curRawSampledStroke = [];
  var curFilteredStroke = [];
  var lastControlPoint = null;
  var filterWeight = 0.5;
  var filterWeightInverse = 1 - filterWeight;
  var stepOffset = 0.0;
  var stepInterval = opts.step ? opts.step : 5;
  var pointCounter = 0;
  var sample = opts.sample ? opts.sample : 1;
  var handlePointFunction = null;

  // ------------------------------------------
  // createBezier
  //
  // Create a look-ahead cubic bezier based on
  // 3 input points and call point handler
  // function on evenly spaced step points
  // along that curve.
  //
  function createBezier(pt0, pt1, pt2) {
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

    // Calculate even steps along curve
    var stepPoints = calculateStepPoints(p0, p1, p2, p3);

    // Call function on new evenly spaced points
    for(var i = 0; i < stepPoints.length; i++) {
      handlePointFunction.call(this, stepPoints[i]);
    }

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
  

} // Scamper