function redrawHybrid() {
  var curves = [];
  var count = 0;
  curves[count] = [];

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

  // Draw each curve
  for (var i = 0; i < curves.length; i++) {
    drawHybrid(curves[i]);
  }
}

function drawHybrid(pts) {
  var minpt;
  var minx;
  var miny;
  var px;
  var py;
  var x;
  var y;
  var del;

	for(var i = 0; i < pts.length-1; i++) {
    px = pts[i].canvasX;
    py = pts[i].canvasY;
    x = pts[i+1].canvasX;
    y = pts[i+1].canvasY;
    del = pts[i+1].time - pts[i].time;
    console.log(del);
    if(del < 5) {
      ctx.strokeStyle = 'rgb(255, 0, 0)';
    } else {
      ctx.strokeStyle = 'rgb(0, 0, 0)';
    }

    minpt = getMinPt(px,py,x,y,Infinity,Infinity,Infinity,Infinity);
    minx = minpt.x;
    miny = minpt.y;
    //ctx.lineWidth = (prs[i+2] < 0.6) ? 1.7 : 2.4;
    //ctx.strokeStyle = calcStrokeStyle(prs[i+2]);
    //ctx.globalAlpha = (prs[i+2] < 0.5) ? 0.5 : 1;
    ctx.translate(minx, miny);
    ctx.beginPath();
    ctx.moveTo(px - minx, py - miny);
    ctx.lineTo(x - minx, y - miny);
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