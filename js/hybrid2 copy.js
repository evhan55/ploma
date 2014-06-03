function redrawHybrid2() {
  var curves = [];
  var newCurves = [];
  var count = 0;
  var currentPressure;
  curves[count] = [];
  newCurves[count] = [];
  //ctx.strokeStyle = '#000000';

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

  count = 0;
  currentPressure = curves[0][0].pressure;

  // Further collect points into distinct curves by pressure
  /*for (var i = 0; i < curves.length; i++) {
    var curve = curves[i];
    for (var j=0; j < curve.length; j++) {
      if(Math.abs(currentPressure - curve[j].pressure) > 0.2) {
        count++;
        newCurves[count] = [];
        currentPressure = curve[j].pressure;
      }
      newCurves[count].push(curve[j]);
    }
    count++
    newCurves[count] = [];
  }
  console.log(newCurves);
  curves = newCurves;*/

  // Group points into groups of 100ms
  // If a group of points has more than
  // 1000 points, then draw with bezier
  // quadratics sampled down by 2, otherwise
  // draw with no curve fitting at normal
  // sampling rate

  // Draw each curve
  for (var i = 0; i < curves.length; i++) {
    if(curves[i].length > 0) {
      var firstPoint = curves[i][0];
      var lastPoint = curves[i][curves[i].length-1];
      var elapsed = lastPoint.time - firstPoint.time;

      if(curves[i].length < 10) {
        if(curves[i].length > 20) {
          var sampledCurve = [];
          for (var j = 0; j < curves[i].length; j++) {
            if(j%2 === 0) {
              sampledCurve.push(curves[i][j]);
            }
          }
          ctx.strokeStyle = '#000000';
          drawHybrid2None(sampledCurve);
        } else {
          ctx.strokeStyle = '#000000';
          drawHybrid2None(curves[i]);
        }
      } else {
        if(curves[i].length > 10) {
          var sampledCurve = [];
          for (var j = 0; j < curves[i].length; j++) {
            if(j%3 === 0) {
              sampledCurve.push(curves[i][j]);
            }
          }
          ctx.strokeStyle = '#FF0000';
          drawHybrid2Bezier(sampledCurve);
        } else {
          ctx.strokeStyle = '#00FF00';
          drawHybrid2Bezier(curves[i]);
        }
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
    //ctx.strokeStyle = calcStrokeStyle(pts[i+1].pressure);
   // ctx.strokeStyle = '#000000';
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
  toggleStyle();
  var p1 = points[0];
  var p2 = points[1];
  
  if(p1) {
    ctx.lineWidth = calcLineWidth(p1.pressure);
    ctx.globalAlpha = calcGlobalAlpha(p1.pressure);
    //ctx.strokeStyle = calcStrokeStyle(p1.pressure);
    //ctx.strokeStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(p1.canvasX, p1.canvasY);

    for (var i = 1; i < points.length; i++) {
      // we pick the point between p1 & p2 as the
      // end point and p1 as our control point
      //ctx.beginPath();
      //ctx.moveTo(p1.canvasX, p1.canvasY);
      if(p1) {
        var midPoint = midPointBtw2(p1, p2);
        ctx.quadraticCurveTo(p1.canvasX, p1.canvasY, midPoint.x, midPoint.y);
        //ctx.quadraticCurveTo(midPoint.x, midPoint.y, p2.canvasX, p2.canvasY);
        //ctx.quadraticCurveTo(midPoint.x, midPoint.y, p2.canvasX, p2.canvasY);
      }
      p1 = points[i];
      p2 = points[i+1];
      //ctx.stroke();
      //ctx.moveTo(midPoint.x, midPoint.y);
      //toggleStyle();
      //ctx.closePath();
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    ctx.lineTo(p1.canvasX, p1.canvasY);
    ctx.stroke();
    ctx.closePath();
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
    //console.log('SWITCH TO RED');
    ctx.strokeStyle = red;
  } else {
    ctx.strokeStyle = black;
  }
}

function calcLineWidth(p) {
  var width;

  width = (p < 0.6) ? 1.9 : 2.4

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