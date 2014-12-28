![](http://i.imgur.com/FczwY4f.png)  

DEMO                                    | BLOG
--------------------------------------- | ---------------------------------------------------------
[Launch demo](http://evhan55.github.io) | [plomaproject.tumblr.com](http://plomaproject.tumblr.com)

## Run Demo (for Wacom tablets)

1. **Install** the [Wacom web plugin](http://us.wacom.com/en/developerrelations/web/)<br>*(automatically included when you install any modern Wacom tablet)*
2. **Open** `index.html` in a WebKit browser
3. **Draw** on canvas with a Wacom pen or check **Use Mouse** to use a mouse

## API

### Ploma

A Ploma instance expects an `HTML <canvas> Element` for rendering ballpoint pen strokes given input points.  Strokes are rendered using `beginStroke`, `extendStroke`, and `endStroke` which accept a single point's data: x-coordinate, y-coordinate and a pressure value ranging from 0-1.  Pressure values can come from any input device you have access to. For Wacom tablets, pressure values can be obtained using the [Wacom web plugin](http://us.wacom.com/en/developerrelations/web/) object element in your HTML.  
  
Example code: [<code>index.html</code>](https://github.com/evhan55/ploma/blob/master/index.html)  
  
<table>
<tr>
  <td width="30%"><code>Ploma(canvas)</code></td>
  <td width="70%">Constructor for Ploma instances.  Accepts an <code>HTML &lt;canvas&gt; Element</code> element to render strokes onto.</td>
</tr>
<tr>
  <td><code>clear()</code></td>
  <td>Clears the canvas.</td>
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
  <td><code>strokes()</code></td>
  <td>Returns an array of all strokes that have been recorded, each stroke itself is an array of point JSON objects.<br> <code>[[{x, y, p}, {x, y, p}, ...], [{x, y, p}, {x, y, p}, ...], ...]</td>
</tr>
<tr>
  <td><code>curStroke()</code></td>
  <td>Returns the current stroke of points that have been stored since the last mouse down as an array of point JSON objects.<br><code>[{x, y, p}, {x, y, p}, ...]</code></td>
</tr>
<tr>
  <td><code>setParallaxOffsetX(n)</code></td>
  <td>Sets the horizontal offset of the cursor to address parallax.</td>
</tr>
<tr>
  <td><code>setParallaxOffsetY(n)</code></td>
  <td>Sets the vertical offset of the cursor to address parallax.</td>
</tr>
</table>

#### Example Usage

```js
var ploma = new Ploma(canvas); // canvas points to a <canvas>
ploma.clear(); // clear the canvas

canvas.onmousedown = function(e) {
  var point = getEventPoint(e)
  ploma.beginStroke(point.x, point.y, point.p); // begin a stroke at the mouse down point
}
canvas.onmousemove = function(e) {
  var point = getEventPoint(e)
  ploma.extendStroke(point.x, point.y, point.p); // extend the stroke at the mouse move point
}
canvas.onmouseup = function(e) {
  var point = getEventPoint(e);
  ploma.endStroke(point.x, point.y, point.p); // end the stroke at the mouse up point
}
```

#### Full Example

Full example usage of Ploma can be found in [index.html](https://github.com/evhan55/ploma/blob/master/index.html)

## Versions

##### v0.3

* **Features:**
    * Refactored into a standalone-plugin with Astrid's help
* **Misc Notes**:

##### v0.2

* **Features**:
    * Texture capability, infinitely mirrored and tiled
* **Misc Notes**:
    * Inline documentation added
    * Some functions renamed

##### v0.1

* **Features**:
    * Input santizing
    * On-the-fly cubic bezier fitting using a look-ahead point
    * Even stepping along beziers for drawing steps
    * Variable-width antialiasing
    * 'Clear' and 'Save' functionality
* **Misc Notes**:
    * Right now this mostly assumes a Wacom plugin pre-installed, since the mouse use case is not of interest.
    * Needs more testing with/without plugin, across all browsers.

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
