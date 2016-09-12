
require([
	// Load our app module and pass it to our definition function
	'../index.js'
], function(
	Ploma
){

	// DOM
	var canvas;
	var save;
	var clear;
	var cursor;
	var plugin;
	var penAPI;

	// State
	var sampling = 2;
	var ploma = null;
	var isDrawing = false;

	// Red Pixel
	var r = new Uint8ClampedArray(16);
	var rid;
	r[0] = 255;
	r[3] = 255;
	r[4] = 255;
	r[7] = 255;
	r[8] = 255;
	r[11] = 255;
	r[12] = 255;
	r[15] = 255;

	// load DOM elements
	canvas = document.getElementById('canvas');
	canvas.setAttribute('width', window.innerWidth);
	canvas.setAttribute('height', window.innerHeight);
	save = document.getElementById('save');
	clear = document.getElementById('clear');
	cursor = document.getElementById('cursor');
	plugin = document.getElementById('wtPlugin');
	penAPI = plugin.penAPI || {
		pressure: 0.9
	};

	//mode.innerHTML = sampling;
	//texture.innerHTML = "T";

	// populate red pixel
	rid = canvas.getContext('2d').createImageData(2, 2);
	rid.data.set(r);

	// load Ploma onto canvas and clear it
	ploma = new Ploma.BallpointPen(canvas);

	////////////
	// BUTTONS
	////////////
	save.onclick = function() {
		window.open(canvas.toDataURL());
	};
	
	clear.onclick = function() {
		ploma.clear();
	};

	cursor.onclick = function() {
		// TODO: UPDATE CHECKBOX OR IMAGE ON BUTTON
		if(canvas.style.cursor === 'none') {
			document.getElementById('cursor-icon').setAttribute('src', 'img/cursor-24.png');
			canvas.style.cursor = 'crosshair';
		} else {
			document.getElementById('cursor-icon').setAttribute('src', 'img/cursor-24-75.png');
			canvas.style.cursor = 'none';
		}
	};

	////////////
	// RESIZE
	////////////
	window.onresize = function() {
		ploma.resize(window.innerWidth, window.innerHeight);
	};

	///////////////////////////////////
	// MOUSE EVENT
	///////////////////////////////////
	canvas.onmousedown = function(e) {
		isDrawing = true;
		if (sampling === 0) return;
		ploma.beginStroke(
			e.clientX,
			e.clientY,
			penAPI.pressure ? penAPI.pressure : 0.9
		);
	};

	canvas.onmousemove = function(e) {
		if (!isDrawing) return;
		if (sampling === 0) {
			canvas.getContext('2d').putImageData(
				rid,
				e.clientX,
				e.clientY,
				0,
				0,
				2,
				2
			);
			return;
		}
		ploma.extendStroke(
			e.clientX,
			e.clientY,
			penAPI.pressure ? penAPI.pressure : 0.9
		);
	};

	canvas.onmouseup = function(e) {
		isDrawing = false;
		if (sampling === 0) return;
		ploma.endStroke(
			e.clientX,
			e.clientY,
			penAPI.pressure ? penAPI.pressure : 0.9
		);
	};

});