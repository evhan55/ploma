/*
to countEvents msecs {
  count = 0
  t1 = (newTimer)
  while ((msecs t1) < msecs) {
    evt = (nextEvent)
        if (notNil evt) { count += 1 }
  }
  return count
}

to showEventCounts {
  openWindow
  repeat 100 {
    print (countEvents 1000)
    gc
  }
}
*/

var start;
var end;

window.onmousedown = function () {
  start = +new Date(); // get unix-timestamp in milliseconds
};

window.onmouseup = function () {
  end = +new Date();
  var diff = end - start; // time difference in milliseconds
  console.log('diff: ' + diff);
};