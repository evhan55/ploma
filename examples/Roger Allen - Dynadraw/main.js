//	dynadraw - http://www.graficaobscura.com/dyna/index.html
//
//	     Use a simple dynamics model to create calligraphic strokes.
//				Paul Haeberli - 1989
//                
//       Javascript translation.
//              Roger Allen - 2010
//              http://www.rogerandwendy.com/roger/dynadraw
//
//       Inspiration to do this & JavaScript starting point.
//              http://mrdoob.com/
//

// ADJUST THESE FOR DIFFERENT EFFECTS
var curmass     = 0.5;  // [0,1] 
var curdrag     = 0.35; // [0,1] 
var WIDTH       = 0.5;  // of the pen
var FIXED_ANGLE = 0;    // 1=fixed, 0=variable

var MIN_MASS = 1.0;
var MAX_MASS = 160.0;
var MIN_DRAG = 0.0;
var MAX_DRAG = 0.5;

var xsize = window.innerWidth;
var ysize = window.innerHeight;
var xyratio = xsize / ysize;
var mouse = new Filter();
var odelx, odely;
var container, canvas, context;
var save, clear;
var isMouseDown = false;

function Filter() {
    this.curx = 0.0;
    this.cury = 0.0;
    this.velx = 0.0;
    this.vely = 0.0;
    this.vel = 0.0;
    this.accx = 0.0;
    this.accy = 0.0;
    this.acc = 0.0;
    this.angx = 0.0;
    this.angy = 0.0;
    this.mass = 0.0;
    this.drag = 0.0;
    this.lastx = 0.0;
    this.lasty = 0.0;
    this.fixedangle = FIXED_ANGLE;
};
Filter.prototype.setpos = function (x, y) {
    this.curx = x;
    this.cury = y;
    this.lastx = x;
    this.lasty = y;
    this.velx = 0.0;
    this.vely = 0.0;
    this.accx = 0.0;
    this.accy = 0.0;
}
Filter.prototype.apply = function (mx, my) {
    var mass, drag;
    var fx, fy, force;

    /* calculate mass and drag */
    mass = flerp(MIN_MASS, MAX_MASS, curmass);
    drag = flerp(MIN_DRAG, MAX_DRAG, curdrag * curdrag);

    /* calculate force and acceleration */
    fx = mx - this.curx;
    fy = my - this.cury;
    this.acc = Math.sqrt(fx * fx + fy * fy);
    if (this.acc < 0.000001) return 0;
    this.accx = fx / mass;
    this.accy = fy / mass;

    /* calculate new velocity */
    this.velx += this.accx;
    this.vely += this.accy;
    this.vel = Math.sqrt(this.velx * this.velx + this.vely * this.vely);
    if (this.vel < 0.000001) return 0;

    /* calculate angle of drawing tool */
    this.angx = -this.vely;
    this.angy = this.velx;
    this.angx /= this.vel;
    this.angy /= this.vel;
    if (this.fixedangle) {
        this.angx = 0.6;
        this.angy = 0.2;
    }

    /* apply drag */
    this.velx = this.velx * (1.0 - drag);
    this.vely = this.vely * (1.0 - drag);

    /* update position */
    this.lastx = this.curx;
    this.lasty = this.cury;
    this.curx = this.curx + this.velx;
    this.cury = this.cury + this.vely;
    return 1;
}

function flerp(f0, f1, p) {
    return ((f0 * (1.0 - p)) + (f1 * p));
}


function init() {
    container = document.getElementById('container');

    canvas = document.createElement("canvas");
    canvas.width = xsize;
    canvas.height = ysize;
    canvas.style.cursor = 'crosshair';
    container.appendChild(canvas);

    context = canvas.getContext("2d");
    onClear();

    save = document.getElementById('save');
    save.addEventListener('click', onSave, false);

    clear = document.getElementById('clear');
    clear.addEventListener('click', onClear, false);

    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mousemove', onMouseMove, false);

    window.addEventListener('mouseout', onMouseUp, false);

    document.onmousedown = function () {
        return false;
    } // avoid text selection

    setInterval("doTimer()", 5);
}

function onMouseDown(e) {
    isMouseDown = true;

    mouse.setpos(mx, my);
    odelx = 0.0;
    odely = 0.0;

    return false;
}

function onMouseUp(e) {
    isMouseDown = false;
    return false;
}

function onMouseMove(e) {
    if (!e) var e = window.event;
    mx = xyratio * e.clientX / xsize;
    my = e.clientY / ysize;
}

function doTimer() {
    if (isMouseDown && mouse.apply(mx, my)) {
        draw();
    }
}

function startStroke() {
    context.moveTo(mouseX, mouseY);
}

function draw() {

    var delx, dely;
    var wid;
    var px, py, nx, ny;

    wid = 0.04 - mouse.vel;
    wid = wid * WIDTH;
    if (wid < 0.00001) wid = 0.00001;
    delx = mouse.angx * wid;
    dely = mouse.angy * wid;

    px = mouse.lastx;
    py = mouse.lasty;
    nx = mouse.curx;
    ny = mouse.cury;

    context.beginPath();
    context.moveTo(xsize * (px + odelx) / xyratio, ysize * (py + odely));
    context.lineTo(xsize * (px - odelx) / xyratio, ysize * (py - odely));
    context.stroke();
    context.lineTo(xsize * (nx - delx) / xyratio, ysize * (ny - dely));
    context.lineTo(xsize * (nx + delx) / xyratio, ysize * (ny + dely));
    context.closePath();
    context.fill(); // change to context.stroke(); to see what is being drawn

    odelx = delx;
    odely = dely;
}

function onSave() {
    window.open(canvas.toDataURL(), 'mywindow');
}

function onClear() {
    context.fillStyle = "rgb(250, 250, 250)";
    context.fillRect(0, 0, xsize, ysize);
    setStyle();
}

function setStyle() {
    context.lineWidth = 1.0;
    context.strokeStyle = "rgba(0,0,0,1.00)";
    context.fillStyle = "rgba(0,0,0,1.00)";
}

init();