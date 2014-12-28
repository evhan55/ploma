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

Call                    | Description
----------------------- | ---
`strokes()`             | Returns an array of all strokes that have been recorded, each stroke itself is an array of point data objects
`curStroke()`           | Returns the current stroke of points that have been stored since the last mouse down as an array of point data objects.
`clear()`               | Clears the canvas.
`beginStroke(x, y, p)`  | Appends a new stroke array containing the point.
`extendStroke(x, y, p)` | Appends the filtered point to the last stroke array.
`endStroke(x, y, p)`    | Appends point to the current stroke array.
`cursorOffsetX`         | To address parallax.
`cursorOffsetY`         | To address parallax.
`setPaperColor(rgb)`    | Sets paper color according to CSS rgb string.

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
