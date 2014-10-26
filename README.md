Ploma - High-fidelity ballpoint pen rendering
v0.1
Optimized for Wacom Cintiq 13HD

Evelyn Eastmond
Dan Amelang
Communications Design Group
SAP
(c) 2014

TODO: License

[plomaproject.tumblr.com](http://plomaproject.tumblr.com)

![](http://38.media.tumblr.com/2bd5a0e58685fc5f5e92ae5d67cd9da6/tumblr_ne0yxflMCX1tvh0uyo1_500.png)

------------

#### Getting Started

1. Open `index.html` in a browser
2. Use mouse or Wacom input device to draw on canvas
3. (OPTIONAL) Adjust `cursorOffsetX` and `cursorOffsetY` to address parallax

#### API Notes

* `filteredStrokes` contains the collected point information
* Input filtering, bezier geometry and even stepping from Dan Amelang's research

#### TODO

* Add texturing
* Refactor Point and Bezier objects
* Optimize to decrease input latency
