function redrawHybrid2() {
  var curves = [];
  var count = 0;
  curves[count] = [];
  //ctx.strokeStyle = '#000000';

  // Collect points into distinct curves
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

      if(curves[i].length < 30) {
        if(curves[i].length > 20) {
          var sampledCurve = [];
          for (var j = 0; j < curves[i].length; j++) {
            if(j%2 === 0) {
              sampledCurve.push(curves[i][j]);
            }
          }
          drawHybrid2None(sampledCurve);
        } else {
          drawHybrid2None(curves[i]);
        }
      } else {
        if(curves[i].length > 30) {
          var sampledCurve = [];
          for (var j = 0; j < curves[i].length; j++) {
            if(j%3 === 0) {
              sampledCurve.push(curves[i][j]);
            }
          }
          drawHybrid2Bezier(sampledCurve);
        } else {
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
  //var elapsed = 0;

  //ctx.strokeStyle = '#000000';

	for(var i = 0; i < pts.length-1; i++) {
    px = pts[i].canvasX;
    py = pts[i].canvasY;
    x = pts[i+1].canvasX;
    y = pts[i+1].canvasY;
    //elapsed += pts[i+1].time - pts[i].time;
    //console.log(elapsed);
    //if(elapsed > 100) {
      //console.log('toggleStyle');
      //toggleStyle();
    //  elapsed = 0;
    //}

    minpt = getMinPt(px,py,x,y,Infinity,Infinity,Infinity,Infinity);
    minx = minpt.x;
    miny = minpt.y;
    ctx.lineWidth = (pts[i+1].pressure < 0.6) ? 1.7 : 2.4;
    //ctx.strokeStyle = calcStrokeStyle(prs[i+2]);
    ctx.globalAlpha = (pts[i+1].pressure < 0.6) ? 0.5 : 1;
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

  //ctx.strokeStyle = '#FF0000';
  //ctx.strokeStyle = '#000000';
  
  if(p1) {
    ctx.globalAlpha = (p1.pressure < 0.2) ? 0.9 : 1;
    ctx.lineWidth = (p1.pressure < 0.6) ? 1.7 : 2.4;
    //ctx.lineWidth = (p1.pressure < 0.6) ? 2.7 : 3.4;
    ctx.beginPath();
    ctx.moveTo(p1.canvasX, p1.canvasY);

    for (var i = 1, len = points.length; i < len; i++) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      //console.log(p1);
      //ctx.beginPath();
      if(p1) {
        var midPoint = midPointBtw2(p1, p2);
        ctx.quadraticCurveTo(p1.canvasX, p1.canvasY, midPoint.x, midPoint.y);
      }
      p1 = points[i];
      p2 = points[i+1];
      //ctx.stroke();
      //ctx.closePath();
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    ctx.lineTo(p1.canvasX, p1.canvasY);
    ctx.stroke();
    ctx.closePath();
  }

  //ctx.closePath();
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

function calcStrokeStyle(p) {
  var style = pat;

  if(p < 0.5) {
    style = pat2;
  }

  return style;
}

function calcGlobalAlpha(p) {
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
}