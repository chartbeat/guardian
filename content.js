MSECONDS_REFRESH = 1000; // 3000 millisecs = 3 secs

// var i;
// var idle = false;
// document.onmousemove = function(){
//     clearInterval(i);
//     idle = false;
//     i = setInterval(function(){idle = true}, MSECONDS_REFRESH);
// }

function repeatSend() {
    chrome.extension.sendRequest({
	method: 'getOpenUrls',
	url: document.URL,
	state: document.webkitVisibilityState,
	msecondsRefresh: MSECONDS_REFRESH,
    });
}
setInterval("repeatSend()", MSECONDS_REFRESH);