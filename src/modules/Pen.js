import last from 'lodash/last';
import merge from 'lodash/merge';
import forEach from 'lodash/forEach';
import cloneDeep from 'lodash/cloneDeep';
import first from 'lodash/first';
import tail from 'lodash/tail';
import initial from 'lodash/initial';
import { paperColorDark, defaultFilterWeight, defaultSample, inkTextureBase64, defaultPenColor, defaultStepInterval } from './constants';
import Point from './Point';
import BezierDrawer from './BezierDrawer';

'use strict'; // for strict mode

//////////////////////////////////////////////
// PRIVATE
//////////////////////////////////////////////

// DOM
var w;
var h;
var ctx;
var canvas;

// State
var rawStrokes;
var curRawSampledStroke;
var curFilteredStroke;
var pointCounter;
var sample;
var paperColor;
var filterWeight;

var bezierDrawer;

// ------------------------------------------
// Pen
//
// Constructor for Pen instances. Accepts
// an HTML <canvas> Element element to render
// strokes onto.
//
export default class DefaultPen {

	constructor(passedCanvas, optConfig) {
		canvas = passedCanvas;
		w = canvas.getAttribute('width');
		h = canvas.getAttribute('height');
		ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		var config = this.getConfiguration(optConfig || {});
		sample = config.sample;
		paperColor = config.paperColor;
		filterWeight = config.filterWeight;
		bezierDrawer = new BezierDrawer(canvas, config.inkTextureBase, config.penColor, config.stepInterval);
		this.clear();
	}

	getConfiguration(config) {
		let defaultConfig = {
			sample: defaultSample,
			inkTextureBase: inkTextureBase64,
			penColor: defaultPenColor,
			paperColor: paperColorDark,
			filterWeight: defaultFilterWeight,
			stepInterval: defaultStepInterval
		};
		return merge(defaultConfig, config);
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
		ctx.fillStyle = paperColor;
		ctx.globalAlpha = 1;
		ctx.fillRect(0, 0, w, h);

		// Reset data
		rawStrokes = [];
		curRawSampledStroke = [];
		curFilteredStroke = [];
		pointCounter = 0;
		bezierDrawer.reset();
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

		bezierDrawer.reset();
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
					curRawSampledStroke[len - 1],
					filterWeight
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
		let oldStrokes = cloneDeep(rawStrokes);
		this.clear();
		this.drawStrokes(oldStrokes);
	}

	drawStrokes(strokes) {
		forEach(strokes, (stroke) => {
			this.drawStroke(stroke);
		});
	}

	drawStroke(points) {
		if (points.length >= 3) {
			let firstPoint = first(points);
			this.beginStroke(firstPoint.x, firstPoint.y, firstPoint.p);
			forEach(tail(initial(points)), (point) => {
				this.extendStroke(point.x, point.y, point.p);
			});
			let lastPoint = last(points);
			this.endStroke(lastPoint.x, lastPoint.y, lastPoint.p);			
		}
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
		var ploma = new DefaultPen(canvas);

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
		bezierDrawer.drawControlPoints(
			curFilteredStroke[len - 3],
			curFilteredStroke[len - 2],
			curFilteredStroke[len - 1]
		);
	}
}


// ------------------------------------------
// calculateFilteredPoint
//
// Returns a filtered, sanitized version of 
// point p2 between points p1 and p3.
//
function calculateFilteredPoint(p1, p2, p3, filterWeight) {
	//if (p1 == null || p2 == null || p3 == null)
	//  return null; // Not enough points yet to filter

	var m = p1.getMidPt(p3);

	return new Point(
		filterWeight * p2.x + (1 - filterWeight) * m.x,
		filterWeight * p2.y + (1 - filterWeight) * m.y,
		filterWeight * p2.p + (1 - filterWeight) * m.p
	);
}