##### Ploma - High-fidelity ballpoint pen rendering
v0.1   

Evelyn Eastmond, Dan Amelang   
evhan55@gmail.com   
Communications Design Group, SAP  
&copy; 2014  
  
TODO: License  
  
[plomaproject.tumblr.com](http://plomaproject.tumblr.com)  
  
![](http://38.media.tumblr.com/2bd5a0e58685fc5f5e92ae5d67cd9da6/tumblr_ne0yxflMCX1tvh0uyo1_500.png)

------------

##### Getting Started
*Best used on a Wacom Cintiq 13HD*  
*Check with Dan Amelang for color consistency across screens*

0. Make sure Wacom browser plugin is installed (automatically included when you install any Wacom stylus)
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

* Add texturing and inkflow anomalies
* Switch to CIELab color space?
* Address curves with more input filtering or sampling?
* Refactor Point and Bezier objects
* Rewrite as stream that accepts pre-recorded strokes for non-realtime use
* Optimize to decrease input latency
* Test, etc. ?

------------
##### Version Notes

##### v0.1

* Test version for November 2014
* Includes:
    * input santizing
    * on-the-fly cubic bezier fitting using a look-ahead point
    * even stepping along beziers for drawing steps
    * variable-width antialiasing
    * 'Clear' and 'Save' functionality
* **Testers**: Pay attention to the pressure/width response and the antialiasing (but not texture), feedback welcome via email!
* Needs more testing with/without plugin, across all browsers.  Right now this mostly assumes a Wacom plugin pre-installed, since the mouse use case is not of interest.
