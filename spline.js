function redrawSpline() {
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
  sample = 3;
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
      pts.push(sampledCurves[i][j][0]);
      pts.push(sampledCurves[i][j][1]);
      prs.push(sampledCurves[i][j][2]);
      prs.push(sampledCurves[i][j][2]);
    }
    //console.log(prs);
    drawSpline(ctx, pts, prs, tension, thickness, darkness, blur, shadowDarkness);
  }
}

// *********************************************************************
// getControlPoints
//   Source: http://scaledinnovation.com/analytics/splines/splines.html
//
function getControlPoints(x0,y0,x1,y1,x2,y2,t){
  //  x0,y0,x1,y1 are the coordinates of the end (knot) pts of this segment
  //  x2,y2 is the next knot -- not connected here but needed to calculate p2
  //  p1 is the control point calculated here, from x1 back toward x0.
  //  p2 is the next control point, calculated here and returned to become the 
  //  next segment's p1.
  //  t is the 'tension' which controls how far the control points spread.
  
  //  Scaling factors: distances from this knot to the previous and following knots.
  var d01=Math.sqrt(Math.pow(x1-x0,2)+Math.pow(y1-y0,2));
  var d12=Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
 
  var fa=t*d01/(d01+d12);
  var fb=t-fa;

  var p1x=x1+fa*(x0-x2);
  var p1y=y1+fa*(y0-y2);

  var p2x=x1-fb*(x0-x2);
  var p2y=y1-fb*(y0-y2);  
  
  return [p1x,p1y,p2x,p2y]
}

// *********************************************************************
// drawSpline
//   Source: http://scaledinnovation.com/analytics/splines/splines.html
//
function drawSpline(ctx,pts,prs,t,th,d,b,sh){
  //ctx.lineWidth = th;
  ctx.shadowBlur = b;
  ctx.save();
  var cp = [];   // array of control points, as x0,y0,x1,y1,...
  var n = pts.length;
  var minpt;
  var minx;
  var miny;

  // Draw an open curve, not connected at the ends
  for(var i=0;i<n-4;i+=2){
    cp=cp.concat(getControlPoints(pts[i],pts[i+1],pts[i+2],pts[i+3],pts[i+4],pts[i+5],t));
  }    
  for(var i=2;i<pts.length-5;i+=2){
    var pressureCoefficient = pressure*prs[i];
    //ctx.strokeStyle = 'rgba(0, 0, 0, '+d*mapPressure(prs[i])+')';
    //ctx.shadowColor = 'rgba(0, 0, 0, '+sh*mapPressure(prs[i])+')';
    //ctx.lineWidth = mapPressure(prs[i])*th;
    minpt = getMinPt(pts[i],pts[i+1],cp[2*i-2],cp[2*i-1],cp[2*i],cp[2*i+1],pts[i+2],pts[i+3]);
    minx = minpt.x;
    miny = minpt.y;
    ctx.translate(minx, miny);
    ctx.beginPath();
    ctx.moveTo(pts[i] - minx, pts[i+1] - miny);
    ctx.bezierCurveTo(
      cp[2*i-2] - minx,
      cp[2*i-1] - miny,
      cp[2*i] - minx,
      cp[2*i+1] - miny,
      pts[i+2] - minx,
      pts[i+3] - miny
    );
    ctx.stroke();
    ctx.closePath();
    ctx.translate(-minx, -miny);
  }

  // For open curves the first and last arcs are simple quadratics.

  // First arc
  //ctx.strokeStyle = 'rgba(0, 0, 0, '+d*mapPressure(prs[i])+')';
  //ctx.shadowColor = 'rgba(0, 0, 0, '+sh*mapPressure(prs[i])+')';
  //ctx.lineWidth = mapPressure(prs[0])*th;
  minpt = getMinPt(pts[0],pts[1],cp[0],cp[1],pts[2],pts[3],Infinity,Infinity);
  minx = minpt.x;
  miny = minpt.y;
  ctx.translate(minx, miny);
  ctx.beginPath();
  ctx.moveTo(pts[0] - minx, pts[1] - miny);
  ctx.quadraticCurveTo(
    cp[0] - minx,
    cp[1] - miny,
    pts[2] - minx,
    pts[3] - miny
  );
  ctx.stroke();
  ctx.closePath();
  ctx.translate(-minx, -miny);
  
  // Last arc
  //ctx.strokeStyle = 'rgba(0, 0, 0, '+d*mapPressure(prs[i])+')';
  //ctx.shadowColor = 'rgba(0, 0, 0, '+sh*mapPressure(prs[i])+')';
  //ctx.lineWidth = mapPressure(prs[n-1])*th;
  minpt = getMinPt(pts[n-2],pts[n-1],cp[2*n-10],cp[2*n-9],pts[n-4],pts[n-3],Infinity,Infinity);
  minx = minpt.x;
  miny = minpt.y;
  ctx.translate(minx, miny);
  ctx.beginPath();
  ctx.moveTo(pts[n-2] - minx, pts[n-1] - miny);
  ctx.quadraticCurveTo(
    cp[2*n-10] - minx,
    cp[2*n-9] - miny,
    pts[n-4] - minx,
    pts[n-3] - miny
  );
  ctx.stroke();
  ctx.closePath();
  ctx.translate(-minx, -miny);
  
  ctx.restore();
}