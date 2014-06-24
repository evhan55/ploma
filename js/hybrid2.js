function redrawHybrid2() {
  var curves = [];
  var newCurves = [];
  var count = 0;
  var currentPressure;
  curves[count] = [];
  newCurves[count] = [];

  // Collect points into distinct curves
  // by penup/pendown
  for (var i = 0; i < capture.length; i++) {
    if(capture[i].break) {
      count++;
      curves[count] = [];
    } else {
      curves[count].push({
        canvasX:    capture[i].canvasX,
        canvasY:    capture[i].canvasY,
        pressure:   capture[i].pressure,
        time:       capture[i].time
      });
    }
  }

  // Draw each curve
  for (var i = 0; i < curves.length; i++) {
    var curve = curves[i];
    //toggleStyle();

    if(curve.length > 2) {
      var area = getCurveArea(curve);
      var firstPoint = curve[0];
      var lastPoint = curve[curve.length-1];
      var elapsed = lastPoint.time - firstPoint.time;

      if((area > 100 && curve.length > 40) || elapsed < 200) {
        var s = curve.length < 50 ? 1 : 3;
        //ctx.strokeStyle = '#FF0000';
        drawHybrid2Bezier(getSampledCurve(curve, sample));
      } else {
        //ctx.strokeStyle = '#000000';
        drawHybrid2None(getSampledCurve(curve, 1));
      }
    }
  }
}

function drawHybrid2None(pts) {
  var minpt;
  var minx;
  var miny;
  var px;
  var py;
  var x;
  var y;

	for(var i = 0; i < pts.length-1; i++) {
    px = pts[i].canvasX;
    py = pts[i].canvasY;
    x = pts[i+1].canvasX;
    y = pts[i+1].canvasY;

    minpt = getMinPt(px,py,x,y,Infinity,Infinity,Infinity,Infinity);
    minx = minpt.x;
    miny = minpt.y;
    ctx.lineWidth = calcLineWidth(pts[i+1].pressure);
    ctx.globalAlpha = calcGlobalAlpha(pts[i+1].pressure);
    ctx.strokeStyle = calcStrokeStyle(pts[i+1].pressure);
    ctx.translate(minx, miny);
    ctx.beginPath();
    ctx.moveTo(px - minx, py - miny);
    ctx.lineTo(x - minx, y - miny);
    ctx.stroke();
    ctx.closePath();
    ctx.translate(-minx, -miny);
  }
}

function drawHybrid2Bezier(points) {
  var p1 = points[0];
  var p2 = points[1];
  var from = p1;
  
  if(p1 && p2) {
    for (var i = 1; i < points.length; i++) {
      if(p1) {
        var midPoint = midPointBtw2(p1, p2);
        drawQuadraticCurve(from, midPoint, p1);
      }
      p1 = points[i];
      p2 = points[i+1];
      from = midPoint;
    }
  }
}

//http://stackoverflow.com/questions/5634460/quadratic-bezier-curve-calculate-point
function drawQuadraticCurve(from, to, ctrl) {
  // using canvas to draw the quadratic
  //ctx.quadraticCurveTo(ctrl.canvasX, ctrl.canvasY, to.x, to.y);

  // using segments to draw the quadratic
  var points = [];
  for (var t = 0; t <= 1; t += 0.5) {
    var newPoint = {};
    newPoint.canvasX = (1 - t) * (1 - t) * from.canvasX + 2 * (1 - t) * t * ctrl.canvasX + t * t * to.canvasX;
    newPoint.canvasY = (1 - t) * (1 - t) * from.canvasY + 2 * (1 - t) * t * ctrl.canvasY + t * t * to.canvasY;
    newPoint.pressure = (from.pressure + to.pressure + ctrl.pressure) / 3;
    points.push(newPoint);
  }
  drawHybrid2None(points);
}

function midPointBtw2(p1, p2) {
  return {
    canvasX: p1.canvasX + (p2.canvasX - p1.canvasX) / 2,
    canvasY: p1.canvasY + (p2.canvasY - p1.canvasY) / 2,
    pressure: (p1.pressure + p2.pressure) / 2
  };
}

function toggleStyle(){
  var black = '#000000';
  var red = '#FF0000';

  if(ctx.strokeStyle === black) {
    ctx.strokeStyle = red;
  } else {
    ctx.strokeStyle = black;
  }
}

function calcLineWidth(p) {
  var width;
  var widthTable;

  widthTable = {
    0.1: 1.2, // needs a texture
    0.2: 1.4, // needs a texture
    0.3: 1.6, // needs a texture
    0.4: 1.8,
    0.5: 2,
    0.6: 2,
    0.7: 2.3,
    0.8: 2.5,
    0.9: 2.5,
    1.0: 2.5
  };

  width = widthTable[decimalAdjust('round', p, -1)];

  return p*3;
}

/**
 * pat = middle tone
 * pat2 = light tone
 * pat3 = dark tone
 */
function calcStrokeStyle(p) {
  var style = pat;
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0, 0, 0, 0)';

  if (p < 0.3) {
    style = pat2;
    //style = 'rgb(0, 0, 0)';
    //ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'rgba(0, 0, 0, 255)';
  }

  if (p > 0.85) {
    style = pat3;
  }

  return style;
}

function calcGlobalAlpha(p) {
  var alpha;
  var alphaTable;

  // Working Version
  alphaTable = {
    0.1: 0.4, // needs a texture
    0.2: 0.5, // needs a texture
    0.3: 0.5, // needs a texture
    0.4: 0.8,
    0.5: 0.8,
    0.6: 0.8,
    0.7: 0.8,
    0.8: 0.95,
    0.9: 0.95,
    1.0: 1
  };

  
  /*alphaTable = {
    0.1: 0.85, // needs a texture
    0.2: 0.85, // needs a texture
    0.3: 0.85, // needs a texture
    0.4: 0.85,
    0.5: 0.85,
    0.6: 0.85,
    0.7: 0.85,
    0.8: 0.95,
    0.9: 0.95,
    1.0: 1
  }*/

  alpha = alphaTable[decimalAdjust('round', p, -1)];

  return alpha;
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


/* function calcGlobalAlpha(p) {
  var alpha;

  if(isSkipping && (skipCounter > 30)) {
    isSkipping = false;
    skipCounter = 0;
  }

  if(emptyInk && (penDownFrame < 5)) {
    isSkipping = true;
    emptyInk = false;
    window.setTimeout(function() {
      emptyInk = true;
    }, 10000);
  }

  if(isSkipping) {
    alpha = 0.5;
    skipCounter++;
  } else {
    alpha = (p < 0.5) ? 0.9 : 1;
  }
  
  return alpha;
}*/