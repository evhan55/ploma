import { last } from 'lodash';
import { map } from './utils';
import { paperColorDark, penR, penG, penB, filterWeight, filterWeightInverse, stepInterval, defaultSample } from './constants';
import {Texture} from './Texture';
import Point from './Point';

'use strict'; // for strict mode

//////////////////////////////////////////////
// PRIVATE
//////////////////////////////////////////////

// DOM
var w;
var h;
var ctx;
var imageData;
var canvas;

// State
var rawStrokes;
var curRawSampledStroke;
var curFilteredStroke;
var lastControlPoint;
var stepOffset;
var pointCounter;
var sample;

var texture;

// ------------------------------------------
// Ploma
//
// Constructor for Ploma instances. Accepts
// an HTML <canvas> Element element to render
// strokes onto.
//
export class BallpointPen {

	constructor(passedCanvas) {
		canvas = passedCanvas;
		w = canvas.getAttribute('width');
		h = canvas.getAttribute('height');
		ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		sample = defaultSample;
		texture = new Texture();
		this.clear();
	}

	//////////////////////////////////////////////
	// PUBLIC
	//////////////////////////////////////////////

	// ------------------------------------------
	// clear
	//
	// Clears the canvas.
	//
	clear() {
		// Clear canvas
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = paperColorDark;
		ctx.globalAlpha = 1;
		ctx.fillRect(0, 0, w, h);
		imageData = ctx.getImageData(0, 0, w, h);

		// Reset data
		rawStrokes = [];
		curRawSampledStroke = [];
		curFilteredStroke = [];
		lastControlPoint = null;
		stepOffset = 0.0;
		pointCounter = 0;
		texture.clear();
	}

	// ------------------------------------------
	// beginStroke
	//
	// Begins a new stroke containing the given
	// point x, y and p (pressure ranging from
	// 0-1) values.
	//
	beginStroke(x, y, p) {
		var point = new Point(x,y,p);
		pointCounter++;

		rawStrokes.push([point]);
		curFilteredStroke = [point];
		curRawSampledStroke = [point];

		// Get the latest canvas pixels in case
		// they've changed since the last stroke
		imageData = ctx.getImageData(0, 0, w, h);

		// Reset step offset for new stroke
		stepOffset = stepInterval;	
	}

	// ------------------------------------------
	// extendStroke
	//
	// Extends the current stroke with the given
	// point and renders the new stroke segment
	// to the canvas.
	//
	extendStroke(x, y, p) {
		pointCounter++;
		
		var point = new Point(x,y,p);

		//
		// Raw
		//
		//if(curRawStroke.last().equals(point)) {
			//return; // ignore dupes TODO: ??
		//}
		last(rawStrokes).push(point);

		//
		// Sampled and filtered
		//
		if (pointCounter % sample === 0) {

			// Push sampled point
			//if(curRawSampledStroke.last().equals(point)) {
				//return; // ignore dupes TODO: ??
			//}
			curRawSampledStroke.push(point);

			// Filter next-to-last input point
			var len = curRawSampledStroke.length;
			if(len >= 3) {
				var fpoint = calculateFilteredPoint(
					curRawSampledStroke[len - 3],
					curRawSampledStroke[len - 2],
					curRawSampledStroke[len - 1]
				);
				curFilteredStroke.push(fpoint);
			}

			// Redraw sampled and filtered
			redraw();
		}
	}

	// ------------------------------------------
	// endStroke
	//
	// Ends the current stroke with the given
	// point and renders the final stroke segment
	// to the canvas.
	//
	endStroke(x, y, p) {
		
		var point = new Point(x,y,p);

		// Keep the last point as is for now
		// TODO: Try to address the "tapering on mouseup" issue
		last(rawStrokes).push(point);
		curRawSampledStroke.push(point);
		curFilteredStroke.push(point);

		redraw();
		lastControlPoint = null;	
	}

	// ------------------------------------------
	// getStrokes
	//
	// Returns an array of all strokes that have
	// been recorded, each stroke itself is an
	// array of point JSON objects.
	//
	// [
	//   [{x, y, p}, {x, y, p}, ...],
	//   [{x, y, p}, {x, y, p}, ...],
	//   ...
	// ]
	//
	getStrokes() {
		var strokes = [];
		for(var i = 0; i < rawStrokes.length; i++){
			var stroke = [];
			strokes.push(stroke);
			for(var j = 0; j < rawStrokes[i].length; j++) {
				stroke.push(rawStrokes[i][j].asObj());
			}
		}
		return strokes;
	}

	// ------------------------------------------
	// setStrokes
	//
	// Sets the strokes to the input array,
	// expected as:
	//
	// [
	//   [{x, y, p}, {x, y, p}, ...],
	//   [{x, y, p}, {x, y, p}, ...],
	//   ...
	// ]
	//
	setStrokes(strokes) {
		// Clear and set rendering to false
		this.clear();
		//applyRendering = !applyRendering;

		// Redraw all the strokes
		for(var i = 0; i < strokes.length; i++) {
			var stroke = strokes[i];
			this.beginStroke(
				stroke[0].x,
				stroke[0].y,
				stroke[0].p
			);
			for(var j = 1; j < stroke.length-1; j++) {
				this.extendStroke(
					stroke[j].x,
					stroke[j].y,
					stroke[j].p
				);
			}
			this.endStroke(
				stroke[stroke.length-1].x,
				stroke[stroke.length-1].y,
				stroke[stroke.length-1].p
			);
		}
	}

	// ------------------------------------------
	// curStroke
	//
	// Returns the current stroke of points that
	// have been stored since the last mouse down
	// as an array of point JSON objects.
	//
	// [{x, y, p}, {x, y, p}, ...]
	//
	curStroke() {
		var curStroke = [];
		for(var i = 0; i < last(rawStrokes).length; i++) {
			curStroke.push(last(rawStrokes)[i].asObj());
		}
		return curStroke;
	}

	// ------------------------------------------
	// setSample
	//
	// Sets the input sampling rate.
	//
	setSample(n) {
		sample = n;
	}

	// ------------------------------------------
	// resize
	//
	// Resize the Ploma instance to a new width
	// and height.
	//
	resize(a, b) {
		canvas.setAttribute('width', a);
		canvas.setAttribute('height', b);
		w = canvas.getAttribute('width');
		h = canvas.getAttribute('height');
		this.clear();
	}

	// ------------------------------------------
	// toggleTexture
	//
	// Set texture on or off, and redraw all the
	// strokes.
	//
	toggleTexture() {
		// Deep copy the raw strokes
		/*var originalStrokes = this.strokes();
		var capturedRawStrokes = [];
		for(var i = 0; i < originalStrokes.length; i++) {
			capturedRawStrokes.push(originalStrokes[i]);
		}*/

		// Clear and set rendering to false
		//this.clear();

		// Redraw all the strokes
		/*for(var i = 0; i < capturedRawStrokes.length; i++) {
			var stroke = capturedRawStrokes[i];
			this.beginStroke(
				stroke[0].x,
				stroke[0].y,
				stroke[0].p
			);
			for(var j = 1; j < stroke.length-1; j++) {
				this.extendStroke(
					stroke[j].x,
					stroke[j].y,
					stroke[j].p
				);
			}
			this.endStroke(
				stroke[stroke.length-1].x,
				stroke[stroke.length-1].y,
				stroke[stroke.length-1].p
			);
		}*/
	}

	
	// ------------------------------------------
	// Ploma.getStrokeImageData
	//
	// Returns image data for the input stroke,
	// against a transparent canvas, clipped to
	// the stroke's bounds.  Input stroke is to
	// be a an array of JSON objects of point
	// data:
	//
	// [{x, y, p}, {x, y, p}, ...]
	//
	getStrokeImageData(inputStroke) {
		// Make a local copy
		var stroke = [];
		for(var i = 0; i < inputStroke.length; i++) {
			stroke.push(inputStroke[i]);
		}

		// For drawing and getting image data later
		var canvas = document.createElement('canvas');

		// Precalculate necessary bounds
		var minx = Infinity;
		var miny = Infinity;
		var maxx = 0;
		var maxy = 0;
		for(let i = 0; i < stroke.length; i++) {
			let point = stroke[i];
			minx = Math.min(minx, point.x);
			miny = Math.min(miny, point.y);
			maxx = Math.max(maxx, point.x);
			maxy = Math.max(maxy, point.y);
		}
		var w = maxx - minx + 8;
		var h = maxy - miny + 8;
		canvas.setAttribute('width', Math.ceil(w));
		canvas.setAttribute('height', Math.ceil(h));

		// Shift points to new origin
		for(let i = 0; i < stroke.length; i++) {
			let point = stroke[i];
			point.x = point.x - minx + 4;
			point.y = point.y - miny + 4;
		}

		// Instantiate Ploma on this new canvas
		var ploma = new BallpointPen(canvas);

		// Draw stroke onto temp canvas
		ploma.beginStroke(
			stroke[0].x,
			stroke[0].y,
			stroke[0].p
		);
		for(let i = 1; i < stroke.length - 1; i++) {
			ploma.extendStroke(
				stroke[i].x,
				stroke[i].y,
				stroke[i].p
			);
		}
		ploma.endStroke(
			stroke[stroke.length - 1].x,
			stroke[stroke.length - 1].y,
			stroke[stroke.length - 1].p
		);

		// Return the image data
		return canvas.getContext('2d').getImageData(0, 0, w, h);
	}

}

// ------------------------------------------
// redraw
//
// Calls the curve drawing function if there
// are enough points for a bezier.
//
function redraw() {
	// TODO:
	// - Handle single point and double point strokes

	// 3 points needed for a look-ahead bezier
	var len = curFilteredStroke.length;
	if(len >= 3) {
		createAndDrawBezier(
			curFilteredStroke[len - 3],
			curFilteredStroke[len - 2],
			curFilteredStroke[len - 1]
		);
	}
}

// ------------------------------------------
// createAndDrawBezier
//
// Draw a look-ahead cubic bezier based on 3
// input points.
//
function createAndDrawBezier(pt0, pt1, pt2) {
	// Endpoints and control points
	var p0 = pt0;
	var p1 = 0.0;
	var p2 = 0.0;
	var p3 = pt1;

	// Value access
	var p0_x = p0.x;
	var p0_y = p0.y;
	var p0_p = p0.p;
	var p3_x = p3.x;
	var p3_y = p3.y;
	var p3_p = p3.p;

	// Calculate p1
	if(!lastControlPoint) {
		p1 = new Point(
			p0_x + (p3_x - p0_x) * 0.33,
			p0_y + (p3_y - p0_y) * 0.33,
			p0_p + (p3_p - p0_p) * 0.33
		);
	} else {
		p1 = lastControlPoint.getMirroredPt(p0);
	}

	// Calculate p2
	if (pt2) {
		p2 = new Point(
			//p3_x - (((p3_x - p0_x) + (pt2.x - p3_x)) / 6),
			//p3_y - (((p3_y - p0_y) + (pt2.y - p3_y)) / 6),
			//p3_p - (((p3_p - p0_p) + (pt2.p - p3_p)) / 6)
			p3_x - (((p3_x - p0_x) + (pt2.x - p3_x)) * 0.1666),
			p3_y - (((p3_y - p0_y) + (pt2.y - p3_y)) * 0.1666),
			p3_p - (((p3_p - p0_p) + (pt2.p - p3_p)) * 0.1666)
		);
	} else {
		p2 = new Point(
			p0_x + (p3_x - p0_x) * 0.66,
			p0_y + (p3_y - p0_y) * 0.66,
			p0_p + (p3_p - p0_p) * 0.66
		);
	}

	// Set last control point
	lastControlPoint = p2;

	// Step along curve and draw step
	var stepPoints = calculateStepPoints(p0, p1, p2, p3);
	for(var i = 0; i < stepPoints.length; i++) {
		drawStep(imageData.data, stepPoints[i]);
	}

	// Calculate redraw bounds
	// TODO:
	// - Math.min = x <= y ? x : y; INLINE
	var p1_x = p1.x;
	var p1_y = p1.y;
	var p2_x = p2.x;
	var p2_y = p2.y;
	var minx = Math.min(p0_x, p1_x, p2_x, p3_x);
	var miny = Math.min(p0_y, p1_y, p2_y, p3_y);
	var maxx = Math.max(p0_x, p1_x, p2_x, p3_x);
	var maxy = Math.max(p0_y, p1_y, p2_y, p3_y);

	// Put image using a crude dirty rect
	//elapsed = Date.now() - elapsed;
	//console.log(elapsed);
	ctx.putImageData(
		imageData,
		0,
		0,
		minx - 5,
		miny - 5,
		(maxx - minx) + 10,
		(maxy - miny) + 10
	);
}

// ------------------------------------------
// calculateStepPoints
//
// Calculates even steps along a bezier with
// control points (p0, p1, p2, p3).
//
function calculateStepPoints(p0, p1, p2, p3) {
	var stepPoints = [];
	var i = stepInterval;

	// Value access
	var p0_x = p0.x;
	var p0_y = p0.y;
	var p0_p = p0.p;

	// Algebraic conveniences, not geometric
	var A_x = p3.x - 3 * p2.x + 3 * p1.x - p0_x;
	var A_y = p3.y - 3 * p2.y + 3 * p1.y - p0_y;
	var A_p = p3.p - 3 * p2.p + 3 * p1.p - p0_p;
	var B_x = 3 * p2.x - 6 * p1.x + 3 * p0_x;
	var B_y = 3 * p2.y - 6 * p1.y + 3 * p0_y;
	var B_p = 3 * p2.p - 6 * p1.p + 3 * p0_p;
	var C_x = 3 * p1.x - 3 * p0_x;
	var C_y = 3 * p1.y - 3 * p0_y;
	var C_p = 3 * p1.p - 3 * p0_p;

	var t = (i - stepOffset) / Math.sqrt(C_x * C_x + C_y * C_y);

	while (t <= 1.0) {
		// Point
		var step_x = t * (t * (t * A_x + B_x) + C_x) + p0_x;
		var step_y = t * (t * (t * A_y + B_y) + C_y) + p0_y;
		var step_p = t * (t * (t * A_p + B_p) + C_p) + p0_p;
		stepPoints.push(new Point(
			step_x,
			step_y,
			step_p
		));

		// Step distance until next one
		var s_x = t * (t * 3 * A_x + 2 * B_x) + C_x; // dx/dt
		var s_y = t * (t * 3 * A_y + 2 * B_y) + C_y; // dy/dt
		var s = Math.sqrt(s_x * s_x + s_y * s_y); // s = derivative in 2D space
		var dt = i / s; // i = interval / derivative in 2D
		t = t + dt;
	}

	// TODO: Maybe use a better approximation for distance along the bezier?
	if (stepPoints.length == 0) // We didn't step at all along this Bezier
		stepOffset = stepOffset + p0.getDistance(p3);
	else
		stepOffset = last(stepPoints).getDistance(p3);

	return stepPoints;
}


// ------------------------------------------
// calculateFilteredPoint
//
// Returns a filtered, sanitized version of 
// point p2 between points p1 and p3.
//
function calculateFilteredPoint(p1, p2, p3) {
	//if (p1 == null || p2 == null || p3 == null)
	//  return null; // Not enough points yet to filter

	var m = p1.getMidPt(p3);

	return new Point(
		filterWeight * p2.x + filterWeightInverse * m.x,
		filterWeight * p2.y + filterWeightInverse * m.y,
		filterWeight * p2.p + filterWeightInverse * m.p
	);
}

// ------------------------------------------
// calculateWidth
//
// Calculates a non-linear width offset in
// the range [-2, 1] based on pressure.
//
function calculateWidth(p) {
	var width = 0.0;
	//console.log(p);

	if(p < 0) { // Possible output from bezier
		width = -3.50;
	}
	if(p < 0.2) {
		width = map(p, 0, 0.2, -3.50, -3.20);
	} 
	if((p >= 0.2) && (p < 0.45)) {
		width = map(p, 0.2, 0.45, -3.20, -2.50);
	}
	if((p >= 0.45) && (p < 0.8)) {
		width = map(p, 0.45, 0.8, -2.50, -1.70);
	}
	if((p >= 0.8) && (p < 0.95)) {
		width = map(p, 0.8, 0.95, -1.70, -1.55);
	}
	if((p >= 0.95) && (p <= 1)) {
		width = map(p, 0.95, 1, -1.55, -1.30);
	}
	if(p > 1) { // Possible output from bezier
		width = -1.30;
	}

	return width;
}

// ------------------------------------------
// drawStep
//
// Draws a 5x5 pixel grid at a step point
// with proper antialiasing and texture.
//
function drawStep(id, point) {

	/////////////////////
	// PRE-LOOP
	/////////////////////

	var width = 0.0;
	width = calculateWidth(point.p);

	/////////////////////
	// LOOP
	/////////////////////

	var p_x = 0.0;
	var p_y = 0.0;
	var p_p = 0.0;
	var centerX = 0.0;
	var centerY = 0.0;
	var i = 0;
	var j = 0;
	var left = 0;
	var right = 0;
	var top = 0;
	var bottom = 0; 
	var dx = 0.0;
	var dy = 0.0;
	var dist = 0.0;
	var a = 0.0;
	var invA = 0.0;
	var idx_0 = 0;
	var idx_1 = 0;
	var idx_2 = 0;
	var idx_0_i = 0;
	var oldR = 0.0;
	var oldG = 0.0;
	var oldB = 0.0;
	var newR = 0.0;
	var newG = 0.0;
	var newB = 0.0;

	p_x = point.x;
	p_y = point.y;
	p_p = point.p;
	centerX = Math.round(p_x);
	centerY = Math.round(p_y);
	left = centerX - 2;
	right = centerX + 3;
	top = centerY - 2;
	bottom = centerY + 3;

	// Step around inside the texture before the loop
	//textureSampleStep = (textureSampleStep === textureSampleLocations.length - 1) ? 0 : (textureSampleStep + 1);

	//////////////
	// Horizontal
	//////////////
	for(i = left; i < right; i++) {

		// Distance
		dx = p_x - i;

		// Byte-index
		idx_0_i = i * 4;

		////////////
		// Vertical
		////////////
		for(j = top; j < bottom; j++) {

			// Distance
			dy = p_y - j;
			dist = Math.sqrt(dx * dx + dy * dy);

			// Byte-index
			idx_0 = idx_0_i + j * ( w * 4 );

			// Antialiasing
			//a = 5 * ((0.3 / (dist - width)) - 0.085);
			a = (1.5 / (dist - width)) - 0.425;

			// Spike
			if(dist < width) {
				a = 1;
			}
			
			// Clamp alpha
			if (a < 0) a = 0;
			if (a >= 1) a = 1;

			// Apply texture
			a *= texture.nextInkTextureSample();

			// Grain
			var g = map(p_p, 0, 1, 0.8, 0.95);
			var prob = 1-(p_p*p_p*p_p*p_p*p_p); // 1 - x^4
			g = Math.floor(Math.random()*prob*2) === 1 ? 0 : g;
			a *= g;

			// Blending vars
			invA = 1 - a;
			idx_1 = idx_0 + 1;
			idx_2 = idx_0 + 2;
			oldR = id[idx_0];
			oldG = id[idx_1];
			oldB = id[idx_2];

			newR = penR * a + oldR * invA;
			newG = penG * a + oldG * invA;
			newB = penB * a + oldB * invA;

			// Set new RGB
			id[idx_0] = newR;
			id[idx_1] = newG;
			id[idx_2] = newB;

		}
	}
}