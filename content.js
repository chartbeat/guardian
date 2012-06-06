MSECONDS_REFRESH = 3000; // 3000 millisecs = 3 secs

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
    });
}
setInterval("repeatSend()", 3000);