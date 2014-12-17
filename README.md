##### Ploma - High-fidelity ballpoint pen rendering for Wacom Cintiq 13HD  
v0.2  

Evelyn Eastmond - evhan55@gmail.com  
Communications Design Group, SAP  
  
Dan Amelang  
Viewpoints Research Institute  
  
(c) 2014  
  
TODO: License  
  
[plomaproject.tumblr.com](http://plomaproject.tumblr.com)  
  
![](http://40.media.tumblr.com/ec2b413030e0fd96f0c7365bcee59b4a/tumblr_nghsnnOYc01tvh0uyo1_500.png)

------------

##### DEMO

[http://evhan55.github.io](Launch demo)

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

* Canvas edge cases not yet handled
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
* Rewrite as stream that accepts pre-recorded strokes for non-realtime use
* Miscellaneous
    * Try Catmull-Rom instead?
    * Switch to CIELab color space?
* Test
* ~~Add texturing capability~~
* ~~Refactor Point object~~

------------
##### Version Notes

##### v0.2

* Test version for December 2014
* **New features**:
    * texture capability, infinitely mirrored and tiled
* **Other changes**:
    * inline documentation added
    * some functions renamed

##### v0.1

* Test version for November 2014
* **Features**:
    * input santizing
    * on-the-fly cubic bezier fitting using a look-ahead point
    * even stepping along beziers for drawing steps
    * variable-width antialiasing
    * 'Clear' and 'Save' functionality
* **Hardware notes**:
    * Right now this mostly assumes a Wacom plugin pre-installed, since the mouse use case is not of interest.
    * Needs more testing with/without plugin, across all browsers.  
