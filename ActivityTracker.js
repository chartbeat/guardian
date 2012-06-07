/**
 * Chartbeat code
 */

/**
 * Encapsulates tracking scrolling, keypresses, and mouse movement.
 * @constructor
 */
function ActivityTracker() {
  this.activityNames_ = [];
  // changed goog.global to window
  this.setUpActivity_(window, 'onscroll');
  this.setUpActivity_(document.body, 'onkeydown');
  this.setUpActivity_(document.body, 'onmousemove');
  this.init();
}

/**
 * Initialize the states of activity trackers
 */
ActivityTracker.prototype.init = function() {
  // Each map in this array corresponds to activity counts from 15
  // seconds of activity. By rotating currentActivity_ through the
  // array as the one we're incrementing (resetting each time we
  // switch), we can keep rudimentary rolling 60 second window of
  // data.
  this.maps_ = [{},{},{},{}];
  this.currentMap_ = 0;
  this.rollOver();
};


/**
 * @return {boolean} has the current 15-second period seen any
 * activity?
 */
ActivityTracker.prototype.isActive = function() {
  for (var i = 0; i < this.activityNames_.length; i++) {
    if (this.maps_[this.currentMap_][this.activityNames_[i]]) {
      return true;
    }
  }
  return false;
};


/**
 * @param {Window|Element} activitySource
 * @param {string} activityName
 */
ActivityTracker.prototype.setUpActivity_ = function(activitySource, activityName) {
  var old = activitySource[activityName] || function() {};
  var self = this;
  this.activityNames_.push(activityName);
  activitySource[activityName] = function(e) {
    // TODO: Double check that this works.
    old.apply(this, arguments);
    if (e && activityName == 'onkeydown') {
      var keynum = e['keyCode'] ? e['keyCode'] : e['which'];
      // Interpret space bar and arrow keys as scrolls
      if (keynum == 32 || (keynum > 36 && keynum < 41)) {
        self.track('onscroll');
        return;
      }
    }
    self.track(activityName);
  };
};

/**
 * Record an event with the specified activity name.
 * @param {string} activityName
 */
ActivityTracker.prototype.track = function(activityName) {
  this.maps_[this.currentMap_][activityName]++;
};


/**
 * Get the value for the provided activity.
 * @param {string} activityName
 */
ActivityTracker.prototype.getValue = function(activityName) {
  var retVal = 0;
  for (var i = 0; i < this.maps_.length; i++) {
    retVal += (this.maps_[i][activityName] || 0);
  }
  return retVal;
};


/**
 * At the end of every 15 seconds, call this to move on to the
 * next 15 second interval.
 */
ActivityTracker.prototype.rollOver = function() {
  this.currentMap_ = (this.currentMap_ + 1) % this.maps_.length;
  for (var i = 0; i < this.activityNames_.length; i++) {
    this.maps_[this.currentMap_][this.activityNames_[i]] = 0;
  }
};
