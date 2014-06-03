function redrawNone() {
  var curves = [];
  var sampledCurves = [];
  var count = 0;
  curves[count] = [];
  ctx.lineCap = 'butt';

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
      pts.push(sampledCurves[i][j][0]);
      pts.push(sampledCurves[i][j][1]);
      prs.push(sampledCurves[i][j][2]);
      prs.push(sampledCurves[i][j][2]);
    }
    drawNone(pts, prs);
  }
}

function drawNone(pts, prs) {
  var minpt;
  var minx;
  var miny;

	for(var i = 0; i < pts.length; i+=2) {
    minpt = getMinPt(pts[i],pts[i+1],pts[i+2],pts[i+3],Infinity,Infinity,Infinity,Infinity);
    minx = minpt.x;
    miny = minpt.y;
    ctx.lineWidth = (prs[i+2] < 0.6) ? 1.7 : 2.4;
    //ctx.strokeStyle = pat;
    ctx.strokeStyle = '#000000';
    ctx.globalAlpha = (prs[i+2] < 0.5) ? 0.8 : 1;
    ctx.translate(minx, miny);
    ctx.beginPath();
    ctx.moveTo(pts[i] - minx, pts[i+1] - miny);
    ctx.lineTo(pts[i+2] - minx, pts[i+3] - miny);
    ctx.stroke();
    ctx.closePath();
    ctx.translate(-minx, -miny);
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