SECONDS_REFRESH = 15;
MSECONDS_REFRESH = SECONDS_REFRESH * 1000; // 3000 millisecs = 3 secs

// var i;
// var idle = false;
// document.onmousemove = function(){
//     clearInterval(i);
//     idle = false;
//     i = setInterval(function(){idle = true}, MSECONDS_REFRESH);
// }
// tracker = null;
tracker = new ActivityTracker();

function repeatSend() {
	// if(tracker) {
	// 	tracker.init();
	// } 
	// else {
	// 	tracker = new ActivityTracker();
	// }
	state = "idle";
	if(tracker.isActive()) {
		state = "engaged";
	}
    chrome.extension.sendRequest({
		method: 'getOpenUrls',
		data: {
			url: document.URL,
			domain: document.domain,
			status: {
				state: state,
				time: new Date(),
			},
			msecondsRefresh: MSECONDS_REFRESH,
		},
    });
    tracker.rollOver();
}
setInterval("repeatSend()", MSECONDS_REFRESH);