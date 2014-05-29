function redrawHybrid2() {
  var curves = [];
  var newCurves = [];
  var count = 0;
  var currentPressure;
  curves[count] = [];
  newCurves[count] = [];

  // Collect points into distinct curves by penup/pendown
  for (var i = 0; i < capture.length; i++) {
    if(capture[i].break) {
      count++;
      curves[count] = [];
    } else {
      // Push point onto current curve
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

    if(curve.length > 2) {
      var area = getCurveArea(curve);
      var firstPoint = curve[0];
      var lastPoint = curve[curve.length-1];
      var elapsed = lastPoint.time - firstPoint.time;

      if((area > 100 && curve.length > 40) || elapsed < 200) {
        //ctx.strokeStyle = '#00FF00';
        //ctx.strokeStyle = pat;
        var s = curve.length < 50 ? 3 : 3;
        ctx.strokeStyle = '#ff0000';
        drawHybrid2Bezier(getSampledCurve(curve, 3));
      } else {
        //ctx.strokeStyle = pat;
        ctx.strokeStyle = '#000000';
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
    //ctx.globalAlpha = calcGlobalAlpha(pts[i+1].pressure);
    //ctx.strokeStyle = calcStrokeStyle(pts[i+1].pressure);
    //ctx.strokeStyle = '#000000';
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
  
  if(p1 && p2) {
    ctx.lineWidth = calcLineWidth(p2.pressure);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.canvasX, p1.canvasY);

    for (var i = 1; i < points.length; i++) {
      // we pick the point between p1 & p2 as the
      // end point and p1 as our control point
      if(p1) {
        var midPoint = midPointBtw2(p1, p2);
        ctx.quadraticCurveTo(
          p1.canvasX,
          p1.canvasY,
          midPoint.x,
          midPoint.y
        );
      }
      p1 = points[i];
      p2 = points[i+1];
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to
    // calculate the bezier control point
    ctx.lineTo(p1.canvasX, p1.canvasY);
    ctx.stroke();
  }
}

function midPointBtw2(p1, p2) {
  return {
    x: p1.canvasX + (p2.canvasX - p1.canvasX) / 2,
    y: p1.canvasY + (p2.canvasY - p1.canvasY) / 2
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

  width = (p < 0.6) ? 1.7 : 2.4

  return width;
}

function calcStrokeStyle(p) {
  var style;

  style = (p < 0.5) ? pat2 : pat;

  return pat;
}

function calcGlobalAlpha(p) {
  var alpha;

  alpha = (Math.floor(Math.random()*8) === 1) ? 0.5 : 1;
  alpha = 1;

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