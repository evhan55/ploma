function redrawHybridDrawing() {
  var curves = [];
  var count = 0;
  curves[count] = [];

  // Collect points into distinct curves
  // by penup/pendown
  for (var i = 0; i < capture.length; i++) {
    if(capture[i].break) {
      count++;
      curves[count] = [];
    } else {
      var pendown = false;
      if(curves[count].length < 10) {
        pendown = true;
      }
      curves[count].push({
        canvasX:    capture[i].canvasX,
        canvasY:    capture[i].canvasY,
        pressure:   capture[i].pressure,
        time:       capture[i].time,
        pendown:    pendown
      });
    }
  }

  // Draw each curve
  for (var i = 0; i < curves.length; i++) {
    var curve = curves[i];

    if(curve.length > 2) {
      var area = getCurveArea(curve);
      var firstPoint = curve[0];
      var lastPoint = curve[curve.length-1];
      var elapsed = lastPoint.time - firstPoint.time;

      if((area > 100 && curve.length > 40) || elapsed < 200) {
        drawHybridBezierDrawing(getSampledCurve(curve, sample));
      } else {
        drawHybridNoneDrawing(getSampledCurve(curve, sample));
      }
    }
  }
}

function drawHybridNoneDrawing(pts) {
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

    var pressure;
    pressure = pts[i+1].pressure;

    ctx.lineWidth = calcLineWidthDrawing(pressure);
    ctx.globalAlpha = calcGlobalAlphaDrawing(pressure);
    ctx.strokeStyle = calcStrokeStyleDrawing(pressure);

    ctx.translate(minx, miny);
    ctx.beginPath();
    ctx.moveTo(px - minx, py - miny);
    ctx.lineTo(x - minx, y - miny);
    ctx.stroke();
    ctx.closePath();
    ctx.translate(-minx, -miny);
  }
}

function drawHybridBezierDrawing(points) {
  var p1 = points[0];
  var p2 = points[1];
  var from = p1;
  
  if(p1 && p2) {
    for (var i = 1; i < points.length; i++) {
      if(p1) {
        var midPoint = midPointBtw2Drawing(p1, p2);
        drawQuadraticCurveDrawing(from, midPoint, p1);
      }
      p1 = points[i];
      p2 = points[i+1];
      from = midPoint;
    }
  }
}

//http://stackoverflow.com/questions/5634460/quadratic-bezier-curve-calculate-point
function drawQuadraticCurveDrawing(from, to, ctrl) {
  // using segments to draw the quadratic
  var points = [];
  for (var t = 0; t <= 1; t += 0.5) {
    var newPoint = {};
    newPoint.canvasX = (1 - t) * (1 - t) * from.canvasX + 2 * (1 - t) * t * ctrl.canvasX + t * t * to.canvasX;
    newPoint.canvasY = (1 - t) * (1 - t) * from.canvasY + 2 * (1 - t) * t * ctrl.canvasY + t * t * to.canvasY;
    newPoint.pressure = (from.pressure + to.pressure + ctrl.pressure) / 3;
    points.push(newPoint);
  }
  drawHybridNoneDrawing(points);
}

function midPointBtw2Drawing(p1, p2) {
  return {
    canvasX: p1.canvasX + (p2.canvasX - p1.canvasX) / 2,
    canvasY: p1.canvasY + (p2.canvasY - p1.canvasY) / 2,
    pressure: (p1.pressure + p2.pressure) / 2
  };
}

function calcLineWidthDrawing(p) {
  var width;

  if(p < 0.4) {
    width = ((p)/(0.4))*(0.7);
  }

  if((p >= 0.4) && (p < 0.7)) {
    width = ((p-0.4)/(0.3))*(2);
  }

  if((p >= 0.7) && (p < 0.9)) {
    width = 1.8;
  }

  if((p >= 0.9)) {
    width = 1.9;
  }

  return width;
}

function calcStrokeStyleDrawing(p) {
  style = pat3;

  return style;
}

function calcGlobalAlphaDrawing(p) {
  var alpha = 0.6;

  return alpha;
}