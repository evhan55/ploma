### Ploma
##### High-fidelity ballpoint pen rendering for Wacom Cintiq 13HD  


|  <color="#F00">DEMO</color>         | BLOG          |
| ------------- | ------------- |
| [Launch demo](http://evhan55.github.io)  | [plomaproject.tumblr.com](http://plomaproject.tumblr.com)  |

## Getting Started


1. [Wacom browser plugin](http://us.wacom.com/en/support/drivers/) (automatically included when you install any Wacom stylus)
2. Open `index.html` in a WebKit browser
3. Draw on canvas with a Wacom pen input or check 'Use Mouse' to use a mouse
4. *OPTIONAL*
    * Adjust `cursorOffsetX` and `cursorOffsetY` to address parallax
    * Toggle 'Show Cursor' to show a mouse cursor

## API

* `strokes()` contains the collected point information
* `curStroke()`
* `beginStroke(x, y, p)`
* `extendStroke(x, y, p)`
* `endStroke(x, y, p)`

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
