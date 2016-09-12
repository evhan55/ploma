![](http://i.imgur.com/M6iIxKa.png)  

DEMO                                    | BLOG
--------------------------------------- | ---------------------------------------------------------
[Launch demo](http://evhan55.github.io/ploma/demo/index.html) | [plomaproject.tumblr.com](http://plomaproject.tumblr.com)

## Running the demo (for Wacom tablets)

1. **Install** the [Wacom web plugin](http://us.wacom.com/en/developerrelations/web/)<br>*(automatically included when you install any modern Wacom tablet)*
2. **Open** `index.html` in a WebKit browser
3. **Draw** on canvas with a Wacom pen or check **Use Mouse** to use a mouse

## Usage

```html
<script type='text/javascript' src="/* YOUR PATH HERE */ploma.js"></script>
```

```js
var canvas = /* YOUR <CANVAS> ELEMENT */;
var isDrawing = false;

var ploma = new Ploma(canvas);
ploma.clear();

canvas.onmousedown = function(e) {
  isDrawing = true;
  ploma.beginStroke(e.clientX, e.clientY, 1);
}

canvas.onmousemove = function(e) {
  if (!isDrawing) return;
  ploma.extendStroke(e.clientX, e.clientY, 1);
}

canvas.onmouseup = function(e) {
  isDrawing = false;
  ploma.endStroke(e.clientX, e.clientY, 1);
}
```

#### Full Example

Full example usage of Ploma can be found in [index.js](https://github.com/athomschke/ploma/blob/master/demo/js/main.js)

## API

A Ploma Pen instance expects an `HTML <canvas> Element` for rendering ballpoint pen strokes given input points.  Strokes are rendered using `beginStroke`, `extendStroke`, and `endStroke` which accept a single point's data: x-coordinate, y-coordinate and a pressure value ranging from 0-1.  Pressure values can come from any input device you have access to. For Wacom tablets, pressure values can be obtained using the [Wacom web plugin](http://us.wacom.com/en/developerrelations/web/) object element in your HTML. 

### Class

Once imported into a project, the Ploma library provides a number of pens, the most elaborate being the Ploma.BallpointPen. All inherit from Ploma.Pen.

<table>
<tr>
  <td width="30%"><code>Ploma.Pen(canvas)</code></td>
  <td width="70%">Constructor for Pen instances.  Accepts an <code>HTML &lt;canvas&gt; Element</code> element to render strokes onto.</td>
</tr>
<tr>
  <td><code>getStrokeImageData(strokes)</code></td>
  <td>Returns image data for the input stroke, against a transparent canvas, clipped to the stroke's bounds.  Input stroke is to be a an array of JSON objects of point data: <br> <code>[{x, y, p}, {x, y, p}, ...]
  </td>
</tr>
</table>

### Instance

<table>
<tr>
  <td width="30%"><code>clear()</code></td>
  <td width="70%">Clears the canvas.</td>
</tr>
<tr>
  <td><code>beginStroke(x, y, p)</code></td>
  <td>Begins a new stroke containing the given point <code>x</code>, <code>y</code> and <code>p</code> (pressure ranging from 0-1) values.</td>
</tr>
<tr>
  <td><code>extendStroke(x, y, p)</code></td>
  <td>Extends the current stroke with the given point and renders the new stroke segment to the canvas.</td>
</tr>
<tr>
  <td><code>endStroke(x, y, p)</code></td>
  <td>Ends the current stroke with the given point and renders the final stroke segment to the canvas.</td>
</tr>
<tr>
  <td><code>getStrokes()</code></td>
  <td>Returns an array of all strokes that have been recorded, each stroke itself is an array of point JSON objects.<br><code>[[{x, y, p}, {x, y, p}, ...],[{x, y, p}, {x, y, p}, ...],...]</code></td>
</tr>
<tr>
  <td><code>setStrokes(s)</code></td>
  <td>Set strokes to be rendered on the canvas. Expects an array strokes, each stroke itself is an array of point JSON objects.<br><code>[[{x, y, p}, {x, y, p}, ...],[{x, y, p}, {x, y, p}, ...],...]</code></td>
</tr>
<tr>
  <td><code>curStroke()</code></td>
  <td>Returns the current stroke of points that have been stored since the last mouse down as an array of point JSON objects.<br><code>[{x, y, p}, {x, y, p}, ...]</code></td>
</tr>
</table>

## Developer guide

Ploma uses [node package manager](https://www.npmjs.com/) in order to manage its dependencies. Once npm is installed, you're ready to go.

In order to make changes to the Ploma library, follow these steps:

1. Clone into https://github.com/evhan55/ploma.git
2. Run 'npm install' in the root directory
2. Run 'npm build' in the root directory
3. Open [path to root directory]/demo/index.html in your browser to run the demo

Plomas core functionality can be found in [path to root directory]/src/modules. Examples for pens, especially the BallpointPen, are available at [path to root directory]/pens. The library exports are described in [path to root directory]/src/ploma.js

Ploma uses webpack to bundle the sources into [path to root directory]/index.js. The ECMAScrip 6 compatible code is transpiled with babel.

## TODO

* Optimize
    * asm.js?
    * Refactor texture access?
* Rendering
    * Add inkflow anomalies
    * Finetune textures at light and heavy touches
* Curves
    * Last mouseup stroke may be missing and not being drawn
    * Wider input filtering
    * Input downsampling?
    * Even stepping deteriorates as step size increases
* Refactor
    * Bezier object
* Miscellaneous
    * Try Catmull-Rom instead?
    * Switch to CIELab color space?
        * RGB of stroke is probably inaccurate, the app should probably be using black for now
* ~~Rewrite as stream that accepts pre-recorded strokes for non-realtime use~~
* ~~Add texturing capability~~
* ~~Refactor Point object~~
