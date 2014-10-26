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

##### v0.1 Notes

* Test version for November 2014
* Testers: pay attention to the pressure/width response and the antialiasing (but not texture), feedback welcome via email!

##### Getting Started
*Best used on a Wacom Cintiq 13HD*  
*Check with Dan Amelang for color consistency across screens*

1. Open `index.html` in a WebKit browser
2. Draw on canvas with a Wacom pen input or check 'Use Mouse' to use a mouse
3. (OPTIONAL)
    * Adjust `cursorOffsetX` and `cursorOffsetY` to address parallax
    * Toggle 'Show Cursor' to show a mouse cursor

##### API Notes

* `filteredStrokes` contains the collected point information
* Input filtering, bezier geometry and even stepping is taken from Dan Amelang's research

##### Known Issues

* RGB of stroke is probably inaccurate, the app should probably be using black for now
* Last mouseup stroke may be missing and not being drawn
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
