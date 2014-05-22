function redrawBezier2() {
  var curves = [];
  var sampledCurves = [];
  var count = 0;
  curves[count] = [];

  // Collect points into distinct curves
  for (var i = 0; i < capture.length; i++) {
    if(capture[i].break) {
      count++;
      curves[count] = [];
    }
    curves[count].push([capture[i].canvasX, capture[i].canvasY, capture[i].pressure]);
  }

  // Sample points down
  if(sample > 1) {
    count = 0;
    for (var i = 0; i < curves.length; i++) {
      var curve = curves[i];
      sampledCurves[count] = [];
      for (var j = 0; j < curve.length; j+=Number(sample)) {
        sampledCurves[count].push(curve[j]);
      }
      count++;
    }
  } else {
    sampledCurves = curves;
  }

  // Draw points and send pressure array
  for (var i = 0; i < sampledCurves.length; i++) {
    var pts = [];
    var prs = [];
    for (var j = 0; j < sampledCurves[i].length; j++) {
      pts.push({
        x: sampledCurves[i][j][0],
        y: sampledCurves[i][j][1],
        p: sampledCurves[i][j][2]
      });
      //pts.push(sampledCurves[i][j][1]);
      //prs.push(sampledCurves[i][j][2]);
      //prs.push(sampledCurves[i][j][2]);
    }
    //console.log(pts);
    drawBezier2(pts);
  }

}

function drawBezier2(points) {
  var p1 = points[0] === undefined ? points[3] : points[0];
  var p2 = points[1] === undefined ? points[4] : points[1];
  var minpt;
  var minx;
  var miny;
  
  if(p1) {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);

    for (var i = 1, len = points.length; i < len; i++) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      if(p1) {
        var midPoint = midPointBtw(p1, p2);
        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      }
      p1 = points[i];
      p2 = points[i+1];
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }
}


function midPointBtw(p1, p2) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}