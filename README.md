##### Ploma - High-fidelity ballpoint pen rendering for Wacom Cintiq 13HD  
v0.3  

Evelyn Eastmond  
evhan55@gmail.com  
Communications Design Group, SAP  
  
Dan Amelang  
Viewpoints Research Institute  
  
(c) 2014  
  
TODO: License  
  
[plomaproject.tumblr.com](http://plomaproject.tumblr.com)  

------------

##### LIVE DEMO

[Launch demo](http://evhan55.github.io)

##### Getting Started

###### Prerequisites

1. [Wacom browser plugin](http://us.wacom.com/en/support/drivers/) installed in your browser (automatically included when you install any Wacom stylus)

###### Launch Ploma
1. Open `index.html` in a WebKit browser
2. Draw on canvas with a Wacom pen input or check 'Use Mouse' to use a mouse
3. (OPTIONAL)
    * Adjust `cursorOffsetX` and `cursorOffsetY` to address parallax
    * Toggle 'Show Cursor' to show a mouse cursor

##### API Notes

* `filteredStrokes` contains the collected point information
* Input filtering, bezier geometry and even stepping is taken from Dan Amelang's research

##### Known Issues

* Canvas edge cases not yet handled?
* RGB of stroke is probably inaccurate, the app should probably be using black for now
* Last mouseup stroke may be missing and not being drawn
* Even stepping deteriorates as step size increases
* Curves not completely accurate
* Latency

##### TODO

* Optimize to decrease input latency
    * asm.js?
* Add inkflow anomalies
* Finetune textures at light and heavy touches
* Address curve shapes
    * wider input filtering
    * input downsampling?
* Refactor Bezier object
* Miscellaneous
    * Try Catmull-Rom instead?
    * Switch to CIELab color space?
* Test
* ~~Rewrite as stream that accepts pre-recorded strokes for non-realtime use~~
* ~~Add texturing capability~~
* ~~Refactor Point object~~

------------
##### Version Notes

##### v0.3

* Test version for December 2014
* **Features:**
    * Refactored into a standalone-plugin with Astrid's help
* **Misc Notes**:

##### v0.2

* Test version for December 2014
* **Features**:
    * Texture capability, infinitely mirrored and tiled
* **Misc Notes**:
    * Inline documentation added
    * Some functions renamed

##### v0.1

* Test version for November 2014
* **Features**:
    * Input santizing
    * On-the-fly cubic bezier fitting using a look-ahead point
    * Even stepping along beziers for drawing steps
    * Variable-width antialiasing
    * 'Clear' and 'Save' functionality
* **Misc Notes**:
    * Right now this mostly assumes a Wacom plugin pre-installed, since the mouse use case is not of interest.
    * Needs more testing with/without plugin, across all browsers.  
