# Ploma
### High-fidelity ballpoint pen rendering for Wacom Cintiq 13HD  


DEMO                                    | BLOG
--------------------------------------- | ---------------------------------------------------------
[Launch demo](http://evhan55.github.io) | [plomaproject.tumblr.com](http://plomaproject.tumblr.com)

## Run Demo

1. Install the [Wacom browser plugin](http://us.wacom.com/en/support/drivers/) (automatically included when you install any modern Wacom tablet)
2. Open `index.html` in a WebKit browser
3. Draw on canvas with a Wacom pen or check **Use Mouse** to use a mouse

## API

View `index.html` source for example of how to use Ploma on your own site  

#### General

<table>
<tr>
  <td width="30%"><code>clear()</code></td>
  <td width="70%">Clears the canvas.</td>
</tr>
<tr>
  <td><code>setPaperColor(cssRGBString)</code></td>
  <td>To set the canvas background color.</td>
</tr>
<tr>
  <td><code>setCursorOffsetX(n)</code></td>
  <td>To address parallax.</td>
</tr>
<tr>
  <td><code>setCursorOffsetY(n)</code></td>
  <td>To address parallax.</td>
</tr>
</table>

#### Strokes

<table>
<tr>
  <td width="30%"><code>strokes()</code></td>
  <td width="70%">Returns an array of all strokes that have been recorded, each stroke itself is an array of point data objects.</td>
</tr>
<tr>
  <td><code>curStroke()</code></td>
  <td>Returns the current stroke of points that have been stored since the last mouse down as an array of point data objects.</td>
</tr>
<tr>
  <td><code>beginStroke(x, y, p)</code></td>
  <td>Appends a new stroke array containing the point.</td>
</tr>
<tr>
  <td><code>extendStroke(x, y, p)</code></td>
  <td>Appends the filtered point to the last stroke array.</td>
</tr>
<tr>
  <td><code>endStroke(x, y, p)</code></td>
  <td>Appends point to the current stroke array.</td>
</tr>
</table>

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
