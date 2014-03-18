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